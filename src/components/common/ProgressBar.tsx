import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
}

export function ProgressBar({ progress, height = 8 }: ProgressBarProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: colors.progressBackground }]}>
      <Animated.View
        style={[styles.fill, animatedStyle, { backgroundColor: colors.progressBar, height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 4, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: 4 },
});
