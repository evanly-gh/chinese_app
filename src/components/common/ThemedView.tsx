import React from 'react';
import { View, ViewProps } from 'react-native';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface ThemedViewProps extends ViewProps {
  variant?: 'background' | 'card';
}

export function ThemedView({ style, variant = 'background', ...props }: ThemedViewProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  return (
    <View
      style={[{ backgroundColor: variant === 'card' ? colors.card : colors.background }, style]}
      {...props}
    />
  );
}
