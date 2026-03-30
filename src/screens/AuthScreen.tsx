import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/common/ThemedText';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onAuth: (userId: string) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const { colors } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) { setError(err.message); return; }
        if (data.user) onAuth(data.user.id);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) { setError(err.message); return; }
        if (data.user) onAuth(data.user.id);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ThemedText style={styles.logo}>汉字</ThemedText>
        <ThemedText type="title" style={styles.title}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </ThemedText>
        <ThemedText type="secondary" style={styles.subtitle}>
          Your progress syncs across all your devices.
        </ThemedText>

        <TextInput
          style={inputStyle}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={inputStyle}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error !== '' && (
          <ThemedText style={[styles.error, { color: colors.again }]}>{error}</ThemedText>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <ThemedText style={styles.buttonText}>
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </ThemedText>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setError(''); setMode(m => m === 'signin' ? 'signup' : 'signin'); }}
          style={styles.switchRow}
        >
          <ThemedText type="secondary" style={styles.switchText}>
            {mode === 'signin'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <ThemedText style={{ color: colors.tint }}>
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 28, gap: 14 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 4 },
  title: { textAlign: 'center', fontSize: 26 },
  subtitle: { textAlign: 'center', fontSize: 14, marginBottom: 8 },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: { fontSize: 13, textAlign: 'center' },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  switchRow: { alignItems: 'center', marginTop: 4 },
  switchText: { fontSize: 14 },
});
