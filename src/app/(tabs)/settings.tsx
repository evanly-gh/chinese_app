import React from 'react';
import { StyleSheet, View, ScrollView, Switch, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/common/ThemedView';
import { ThemedText } from '../../components/common/ThemedText';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { getCardsForLevel } from '../../data';

const PRESET_COLORS = [
  '#D32F2F', // red
  '#1976D2', // blue
  '#388E3C', // green
  '#7B1FA2', // purple
  '#F57C00', // orange
  '#C2185B', // pink
  '#00796B', // teal
  '#303F9F', // indigo
];

function SettingRow({
  label,
  sublabel,
  right,
}: {
  label: string;
  sublabel?: string;
  right: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {sublabel && <ThemedText type="secondary" style={styles.rowSublabel}>{sublabel}</ThemedText>}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSetting } = useSettings();

  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const goalOptions = [5, 10, 15, 20, 30, 50, 100];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>

          {/* HSK Level (multi-select) */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.sectionTitle}>HSK Levels</ThemedText>
            <ThemedText type="secondary" style={styles.rowSublabel}>
              Select one or more levels to study
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.levelRow}>
                {levels.map(level => {
                  const hasCards = getCardsForLevel(level).length > 0;
                  const isActive = settings.activeLevels.includes(level);
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => {
                        if (!hasCards) return;
                        let newLevels: number[];
                        if (isActive) {
                          if (settings.activeLevels.length === 1) return; // keep at least one
                          newLevels = settings.activeLevels.filter(l => l !== level);
                        } else {
                          newLevels = [...settings.activeLevels, level].sort((a, b) => a - b);
                        }
                        // Sync all level filters at once
                        updateSetting('activeLevels', newLevels);
                        updateSetting('exerciseLevelFilter', newLevels);
                        updateSetting('flashcardConfig', {
                          ...settings.flashcardConfig,
                          levelFilter: newLevels,
                        });
                      }}
                      style={[
                        styles.levelChip,
                        isActive && { backgroundColor: colors.tint },
                        !hasCards && styles.levelChipDisabled,
                        { borderColor: isActive ? colors.tint : colors.border },
                      ]}
                      activeOpacity={hasCards ? 0.7 : 1}
                    >
                      <ThemedText
                        style={[
                          styles.levelChipText,
                          isActive && styles.levelChipTextActive,
                          !hasCards && { color: colors.textSecondary },
                        ]}
                      >
                        {level}
                      </ThemedText>
                      {!hasCards && (
                        <ThemedText style={[styles.comingSoon, { color: colors.textSecondary }]}>
                          Soon
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </ThemedView>

          {/* Daily Goal */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Daily Goal</ThemedText>
            <View style={styles.goalRow}>
              {goalOptions.map(goal => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => updateSetting('dailyGoal', goal)}
                  style={[
                    styles.goalChip,
                    settings.dailyGoal === goal && { backgroundColor: colors.tint },
                    { borderColor: settings.dailyGoal === goal ? colors.tint : colors.border },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.goalChipText,
                      settings.dailyGoal === goal && styles.levelChipTextActive,
                    ]}
                  >
                    {goal}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <ThemedText type="secondary" style={styles.goalHint}>
              {settings.dailyGoal} cards per day
            </ThemedText>
          </ThemedView>

          {/* Learning */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Learning</ThemedText>
            <ThemedText style={styles.rowLabel}>Working Set Size</ThemedText>
            <ThemedText type="secondary" style={styles.rowSublabel}>
              How many words you actively study at once before unlocking new ones
            </ThemedText>
            <View style={styles.goalRow}>
              {[5, 10, 15, 20].map(size => (
                <TouchableOpacity
                  key={size}
                  onPress={() => updateSetting('workingSetSize', size)}
                  style={[
                    styles.goalChip,
                    settings.workingSetSize === size && { backgroundColor: colors.tint },
                    { borderColor: settings.workingSetSize === size ? colors.tint : colors.border },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.goalChipText,
                      settings.workingSetSize === size && styles.levelChipTextActive,
                    ]}
                  >
                    {size}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          {/* Toggles */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
            <SettingRow
              label="Audio Pronunciation"
              sublabel="Speak cards aloud when revealed"
              right={
                <Switch
                  value={settings.ttsEnabled}
                  onValueChange={v => updateSetting('ttsEnabled', v)}
                  trackColor={{ true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingRow
              label="Traditional Characters"
              sublabel="Show 繁體 instead of 简体"
              right={
                <Switch
                  value={settings.useTraditional}
                  onValueChange={v => updateSetting('useTraditional', v)}
                  trackColor={{ true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingRow
              label="Show Pinyin"
              sublabel="Display pinyin below characters"
              right={
                <Switch
                  value={settings.showPinyin}
                  onValueChange={v => updateSetting('showPinyin', v)}
                  trackColor={{ true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingRow
              label="Listening Exercises"
              sublabel="Include audio-first exercise types"
              right={
                <Switch
                  value={settings.listenExercisesEnabled}
                  onValueChange={v => updateSetting('listenExercisesEnabled', v)}
                  trackColor={{ true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </ThemedView>

          {/* Appearance / Theme */}
          <ThemedView variant="card" style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>

            {/* Theme selector: Light | Dark | Custom */}
            <View style={styles.themeRow}>
              {(['light', 'dark', 'custom'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => updateSetting('theme', mode)}
                  style={[
                    styles.themeChip,
                    settings.theme === mode && { backgroundColor: colors.tint },
                    { borderColor: settings.theme === mode ? colors.tint : colors.border },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.themeChipText,
                      settings.theme === mode && styles.levelChipTextActive,
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom theme options */}
            {settings.theme === 'custom' && (
              <View style={styles.customThemeBlock}>
                {/* Color swatches */}
                <ThemedText type="secondary" style={styles.customLabel}>Accent Color</ThemedText>
                <View style={styles.swatchRow}>
                  {PRESET_COLORS.map(hex => (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => updateSetting('customTheme', { ...settings.customTheme, primary: hex })}
                      style={[
                        styles.swatch,
                        { backgroundColor: hex },
                        settings.customTheme.primary === hex && styles.swatchSelected,
                      ]}
                    />
                  ))}
                </View>

                {/* Custom hex input */}
                <TextInput
                  value={settings.customTheme.primary}
                  onChangeText={text => updateSetting('customTheme', { ...settings.customTheme, primary: text })}
                  placeholder="#RRGGBB"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.hexInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  autoCapitalize="characters"
                  maxLength={7}
                />

                {/* Base: Light / Dark */}
                <ThemedText type="secondary" style={styles.customLabel}>Base Theme</ThemedText>
                <View style={styles.baseRow}>
                  {(['light', 'dark'] as const).map(base => (
                    <TouchableOpacity
                      key={base}
                      onPress={() => updateSetting('customTheme', { ...settings.customTheme, base })}
                      style={[
                        styles.baseChip,
                        settings.customTheme.base === base && { backgroundColor: colors.tint },
                        { borderColor: settings.customTheme.base === base ? colors.tint : colors.border },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.themeChipText,
                          settings.customTheme.base === base && styles.levelChipTextActive,
                        ]}
                      >
                        {base.charAt(0).toUpperCase() + base.slice(1)} Base
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ThemedView>

          <ThemedText type="secondary" style={styles.footer}>
            HSK 1–5 included · HSK 6–9 coming soon
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  card: { borderRadius: 16, padding: 20, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelChip: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChipDisabled: { opacity: 0.5 },
  levelChipText: { fontSize: 20, fontWeight: '700' },
  levelChipTextActive: { color: '#FFFFFF' },
  comingSoon: { fontSize: 8 },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  goalChipText: { fontSize: 15, fontWeight: '600' },
  goalHint: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15 },
  rowSublabel: { fontSize: 13 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  themeChipText: { fontSize: 14, fontWeight: '600' },
  customThemeBlock: { gap: 12, marginTop: 4 },
  customLabel: { fontSize: 13, fontWeight: '600' },
  swatchRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  hexInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'monospace',
  },
  baseRow: { flexDirection: 'row', gap: 10 },
  baseChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  footer: { textAlign: 'center', fontSize: 13, marginTop: 4 },
});
