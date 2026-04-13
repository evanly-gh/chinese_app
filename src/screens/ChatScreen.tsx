import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../components/common/ThemedView';
import { ThemedText } from '../components/common/ThemedText';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { ChatMessage, sendChatMessage, startChat } from '../utils/chatUtils';

interface ChatScreenProps {
  onBack: () => void;
}

function MessageBubble({
  message,
  colors,
  expanded,
  onToggleTeacher,
}: {
  message: ChatMessage;
  colors: any;
  expanded: boolean;
  onToggleTeacher: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.tint }]
            : [styles.bubbleAssistant, { backgroundColor: colors.card }],
        ]}
      >
        <ThemedText
          style={[
            styles.bubbleText,
            isUser && { color: '#FFFFFF' },
            !isUser && { fontSize: 17, lineHeight: 26 },
          ]}
        >
          {message.text}
        </ThemedText>

        {!isUser && message.teacherNote ? (
          <TouchableOpacity onPress={onToggleTeacher} style={styles.teacherToggle}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'school-outline'}
              size={16}
              color={colors.tint}
            />
            <ThemedText style={[styles.teacherToggleText, { color: colors.tint }]}>
              {expanded ? 'Hide' : 'Teacher Notes'}
            </ThemedText>
          </TouchableOpacity>
        ) : null}

        {!isUser && expanded && message.teacherNote ? (
          <View style={[styles.teacherBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <ThemedText style={styles.teacherText}>{message.teacherNote}</ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatScreen({ onBack }: ChatScreenProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  const initConversation = useCallback(async () => {
    setInitializing(true);
    setMessages([]);
    setExpandedSet(new Set());
    setError(null);
    try {
      const result = await startChat(settings);
      setMessages([{ role: 'assistant', text: result.reply, teacherNote: result.teacher }]);
      setExpandedSet(new Set([0]));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setInitializing(false);
    }
  }, [settings]);

  // Start conversation on mount
  useEffect(() => {
    initConversation();
  }, []);

  const toggleTeacher = useCallback((index: number) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await sendChatMessage(messages, trimmed, settings);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: result.reply,
        teacherNote: result.teacher,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setExpandedSet(prev => new Set([...prev, updatedMessages.length]));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, settings]);

  // Initializing state
  if (initializing) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>{'‹ Back'}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>AI Chat</ThemedText>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText type="secondary" style={{ marginTop: 12 }}>Starting conversation...</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>{'‹ Back'}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>AI Chat</ThemedText>
          <TouchableOpacity
            onPress={initConversation}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={22} color={colors.tint} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.chatBody}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <MessageBubble
                message={item}
                colors={colors}
                expanded={expandedSet.has(index)}
                onToggleTeacher={() => toggleTeacher(index)}
              />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />

          {error ? (
            <View style={[styles.errorBar, { backgroundColor: colors.again + '20' }]}>
              <ThemedText style={[styles.errorText, { color: colors.again }]}>{error}</ThemedText>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.typingRow}>
              <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.textSecondary, opacity: 0.6 }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.textSecondary, opacity: 0.3 }]} />
            </View>
          ) : null}

          <SafeAreaView edges={['bottom']} style={[styles.inputBar, { borderTopColor: colors.border }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type in Chinese or English..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.textInput,
                { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
              ]}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || loading}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !loading ? colors.tint : colors.border },
              ]}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centeredContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  backText: { fontSize: 18, fontWeight: '600' },

  // Chat body
  chatBody: { flex: 1 },
  messageList: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },

  // Bubbles
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start', marginVertical: 2 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 18, padding: 12 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  // Teacher notes
  teacherToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
  },
  teacherToggleText: { fontSize: 13, fontWeight: '600' },
  teacherBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  teacherText: { fontSize: 13, lineHeight: 20 },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Error
  errorBar: {
    marginHorizontal: 12,
    padding: 8,
    borderRadius: 8,
  },
  errorText: { fontSize: 13, textAlign: 'center' },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
