import React from 'react';
import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';

interface QuickSettingsPopoverProps {
  onClose: () => void;
}

export function QuickSettingsPopover({ onClose }: QuickSettingsPopoverProps) {
  const { colors } = useTheme();
  const { settings, updateSetting } = useSettings();

  return (
    <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}}>
        <ThemedView variant="card" style={[styles.popover, { borderColor: colors.border }]}>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Show Pinyin</ThemedText>
            <Switch
              value={settings.showPinyin}
              onValueChange={v => updateSetting('showPinyin', v)}
              trackColor={{ true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <ThemedText style={styles.label}>Listening Exercises</ThemedText>
            <Switch
              value={settings.listenExercisesEnabled}
              onValueChange={v => updateSetting('listenExercisesEnabled', v)}
              trackColor={{ true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
        </ThemedView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
  },
  popover: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    zIndex: 101,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: { fontSize: 14, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
});
