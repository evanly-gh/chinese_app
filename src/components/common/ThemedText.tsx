import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'secondary' | 'title' | 'caption';
}

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        styles.base,
        { color: type === 'secondary' ? colors.textSecondary : colors.text },
        type === 'title' && styles.title,
        type === 'caption' && styles.caption,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  caption: { fontSize: 12 },
});
