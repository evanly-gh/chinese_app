import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '../../components/common/ThemedView';
import { ThemedText } from '../../components/common/ThemedText';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useProgress } from '../../hooks/useProgress';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../theme/colors';
import { getAllCardIds, getCardsForLevel } from '../../data';
import { getAllSRSStates } from '../../storage/cardStateStorage';
import { getLevelStats, getWeakCards, getWorkingSet } from '../../utils/cardUtils';
import { isMastered } from '../../algorithms/sm2';
import { VocabCard, SRSState } from '../../types/vocab';

const HSK_LEVELS = [1, 2, 3, 4, 5];

// ── Info Modal ────────────────────────────────────────────────────────────────
function InfoModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: ThemeColors }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={infoStyles.overlay} onPress={onClose}>
        <Pressable style={[infoStyles.box, { backgroundColor: colors.card }]} onPress={() => {}}>
          <ThemedText style={infoStyles.heading}>Card Stats Explained</ThemedText>
          {[
            { label: 'Mastered', desc: 'interval ≥ 21 days — card appears infrequently for review' },
            { label: 'E-factor', desc: 'ease factor (lower = harder). Normal is 2.5' },
            { label: 'Lapses (✗)', desc: 'times you marked wrong after knowing' },
            { label: 'Not started', desc: 'never reviewed' },
          ].map(({ label, desc }) => (
            <View key={label} style={infoStyles.row}>
              <ThemedText style={infoStyles.label}>{label}:</ThemedText>
              <ThemedText type="secondary" style={infoStyles.desc}>{desc}</ThemedText>
            </View>
          ))}
          <TouchableOpacity onPress={onClose} style={[infoStyles.closeBtn, { backgroundColor: colors.tint }]}>
            <ThemedText style={infoStyles.closeBtnText}>Got it</ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const infoStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  box: { borderRadius: 16, padding: 24, width: '85%', gap: 12 },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  row: { gap: 2 },
  label: { fontSize: 14, fontWeight: '600' },
  desc: { fontSize: 13 },
  closeBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ── Working Set Chip ──────────────────────────────────────────────────────────
function WorkingChip({
  card,
  state,
  colors,
}: {
  card: VocabCard;
  state: SRSState | undefined;
  colors: ThemeColors;
}) {
  const dotColor = !state
    ? colors.border
    : isMastered(state)
    ? colors.easy
    : state.repetition > 0
    ? colors.good
    : colors.border;

  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[chipStyles.dot, { backgroundColor: dotColor }]} />
      <ThemedText style={chipStyles.hanzi}>{card.simplified}</ThemedText>
      <ThemedText type="secondary" style={chipStyles.pinyin}>{card.pinyin}</ThemedText>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  hanzi: { fontSize: 20, fontWeight: '600' },
  pinyin: { fontSize: 10 },
});

// ── Card Row ──────────────────────────────────────────────────────────────────
function CardRow({
  card,
  state,
  colors,
}: {
  card: VocabCard;
  state: SRSState | undefined;
  colors: ThemeColors;
}) {
  const dotColor = !state
    ? colors.border
    : isMastered(state)
    ? colors.easy
    : state.repetition > 0
    ? colors.good
    : colors.border;

  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[rowStyles.dot, { backgroundColor: dotColor }]} />
      <ThemedText style={rowStyles.hanzi}>{card.simplified}</ThemedText>
      <ThemedText type="secondary" style={rowStyles.pinyin}>{card.pinyin}</ThemedText>
      {state && state.lapses > 0 && (
        <ThemedText style={[rowStyles.lapses, { color: colors.hard }]}>{state.lapses}✗</ThemedText>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  hanzi: { fontSize: 20, width: 44 },
  pinyin: { flex: 1, fontSize: 13 },
  lapses: { fontSize: 12, fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { colors } = useTheme();
  const { data, loading, reload } = useProgress();
  const { settings } = useSettings();

  const [selectedLevel, setSelectedLevel] = useState(settings.activeLevel);
  const [levelStates, setLevelStates] = useState<Record<string, SRSState>>({});
  const [levelLoading, setLevelLoading] = useState(false);
  const [weakExpanded, setWeakExpanded] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Load states for the selected level whenever it changes
  useEffect(() => {
    let cancelled = false;
    async function loadLevelStates() {
      setLevelLoading(true);
      const ids = getAllCardIds(selectedLevel);
      const states = await getAllSRSStates(ids);
      if (!cancelled) {
        setLevelStates(states);
        setLevelLoading(false);
      }
    }
    loadLevelStates();
    return () => { cancelled = true; };
  }, [selectedLevel]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (!data) return null;

  const maxCount = Math.max(...data.dailyPoints.map(p => p.count), 1);

  const selectedCards = getCardsForLevel(selectedLevel);
  const { learned: selLearned, total: selTotal, mastered: selMastered } = getLevelStats(selectedCards, levelStates);
  const selCompletionPct = selTotal > 0 ? Math.round((selLearned / selTotal) * 100) : 0;

  const workingSet = getWorkingSet(selectedCards, levelStates, settings.workingSetSize);
  const weakCards = getWeakCards(selectedCards, levelStates);
  const displayedWeakCards = weakExpanded ? weakCards : weakCards.slice(0, 10);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.pageTitle}>Progress</ThemedText>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.streak}</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>Day Streak</ThemedText>
            </ThemedView>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.todayCount}</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>Today</ThemedText>
            </ThemedView>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.mastered}</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>Mastered</ThemedText>
            </ThemedView>
            <ThemedView variant="card" style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: colors.tint }]}>{data.completionPct}%</ThemedText>
              <ThemedText type="secondary" style={styles.statLabel}>HSK {settings.activeLevel}</ThemedText>
            </ThemedView>
          </View>

          {/* HSK Level Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScroll}
            contentContainerStyle={styles.tabContainer}
          >
            {HSK_LEVELS.map(level => {
              const active = level === selectedLevel;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => setSelectedLevel(level)}
                  style={[
                    styles.tab,
                    { borderColor: active ? colors.tint : colors.border },
                    active && { backgroundColor: colors.tint },
                  ]}
                  activeOpacity={0.75}
                >
                  <ThemedText style={[styles.tabText, active && styles.tabTextActive]}>
                    HSK {level}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {levelLoading ? (
            <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 8 }} />
          ) : (
            <>
              {/* Level completion for selected level */}
              <ThemedView variant="card" style={styles.card}>
                <ThemedText style={styles.cardTitle}>HSK {selectedLevel} Progress</ThemedText>
                <View style={styles.cardRow}>
                  <ThemedText type="secondary">{selLearned} of {selTotal} words learned</ThemedText>
                  <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>{selCompletionPct}%</ThemedText>
                </View>
                <ProgressBar progress={selCompletionPct / 100} height={12} />
                <View style={styles.cardRow}>
                  <ThemedText type="secondary" style={styles.miniStat}>Mastered: {selMastered}</ThemedText>
                  <ThemedText type="secondary" style={styles.miniStat}>Not started: {selTotal - selLearned}</ThemedText>
                </View>
              </ThemedView>

              {/* Working Set */}
              {workingSet.length > 0 && (
                <ThemedView variant="card" style={styles.card}>
                  <ThemedText style={styles.cardTitle}>Working Set</ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {workingSet.map(card => (
                      <WorkingChip
                        key={card.id}
                        card={card}
                        state={levelStates[card.id]}
                        colors={colors}
                      />
                    ))}
                  </ScrollView>
                  <View style={styles.chipLegend}>
                    {[
                      { color: colors.easy, label: 'Mastered' },
                      { color: colors.good, label: 'Learning' },
                      { color: colors.border, label: 'New' },
                    ].map(({ color, label }) => (
                      <View key={label} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color }]} />
                        <ThemedText type="secondary" style={styles.legendLabel}>{label}</ThemedText>
                      </View>
                    ))}
                  </View>
                </ThemedView>
              )}

              {/* All characters in selected level */}
              <ThemedView variant="card" style={styles.card}>
                <ThemedText style={styles.cardTitle}>All HSK {selectedLevel} Characters</ThemedText>
                <FlatList
                  data={selectedCards}
                  keyExtractor={c => c.id}
                  renderItem={({ item }) => (
                    <CardRow card={item} state={levelStates[item.id]} colors={colors} />
                  )}
                  scrollEnabled={false}
                />
              </ThemedView>

              {/* Weak cards */}
              {weakCards.length > 0 && (
                <ThemedView variant="card" style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <ThemedText style={styles.cardTitle}>Weakest Cards</ThemedText>
                    <TouchableOpacity onPress={() => setInfoVisible(true)} style={styles.infoBtn}>
                      <ThemedText style={[styles.infoBtnText, { color: colors.tint }]}>?</ThemedText>
                    </TouchableOpacity>
                  </View>
                  {displayedWeakCards.map(card => (
                    <View key={card.id} style={[styles.weakCard, { borderBottomColor: colors.border }]}>
                      <ThemedText style={styles.weakHanzi}>{card.simplified}</ThemedText>
                      <ThemedText type="secondary" style={styles.weakPinyin}>{card.pinyin}</ThemedText>
                      {card.lapses > 0 && (
                        <View style={[styles.efBadge, { backgroundColor: colors.hard + '20', marginRight: 4 }]}>
                          <ThemedText style={[styles.efText, { color: colors.hard }]}>
                            {card.lapses}✗
                          </ThemedText>
                        </View>
                      )}
                      <View style={[styles.efBadge, { backgroundColor: colors.again + '20' }]}>
                        <ThemedText style={[styles.efText, { color: colors.again }]}>
                          {card.efactor.toFixed(1)}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                  {weakCards.length > 10 && (
                    <TouchableOpacity onPress={() => setWeakExpanded(e => !e)} style={styles.seeMoreBtn}>
                      <ThemedText style={[styles.seeMoreText, { color: colors.tint }]}>
                        {weakExpanded ? 'See Less' : `See More (${weakCards.length - 10} more)`}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
              )}
            </>
          )}

          {/* Daily chart */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.cardTitle}>Cards Reviewed (14 days)</ThemedText>
            <View style={styles.chartContainer}>
              {data.dailyPoints.slice(-14).map((point, i) => (
                <View key={point.date} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (point.count / maxCount) * 120),
                          backgroundColor: point.count > 0 ? colors.tint : colors.border,
                        },
                      ]}
                    />
                  </View>
                  {i % 3 === 0 && (
                    <ThemedText type="secondary" style={styles.barLabel}>{point.label}</ThemedText>
                  )}
                </View>
              ))}
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} colors={colors} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 16 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  // Level tabs
  tabScroll: { flexGrow: 0 },
  tabContainer: { gap: 8, paddingVertical: 2 },
  tab: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 8 },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  // Cards
  card: { borderRadius: 16, padding: 20, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniStat: { fontSize: 12 },
  // Working set
  chipRow: { gap: 8 },
  chipLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
  // Weak cards
  weakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  weakHanzi: { fontSize: 22, width: 48 },
  weakPinyin: { flex: 1, fontSize: 14 },
  efBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  efText: { fontSize: 12, fontWeight: '700' },
  seeMoreBtn: { paddingVertical: 8, alignItems: 'center' },
  seeMoreText: { fontSize: 14, fontWeight: '600' },
  // Info button
  infoBtn: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoBtnText: { fontSize: 14, fontWeight: '700' },
  // Chart
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 2 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '80%', borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 9, textAlign: 'center' },
});
