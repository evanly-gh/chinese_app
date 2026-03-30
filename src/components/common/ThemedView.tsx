import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ThemedViewProps extends ViewProps {
  variant?: 'background' | 'card';
}

export function ThemedView({ style, variant = 'background', ...props }: ThemedViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ backgroundColor: variant === 'card' ? colors.card : colors.background }, style]}
      {...props}
    />
  );
}
