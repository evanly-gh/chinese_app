import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'secondary' | 'title' | 'caption';
}

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
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
