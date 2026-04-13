import { VocabCard } from '../types/vocab';
import { AppSettings } from '../types/settings';
import { getCardsForLevel, getAllCardIds } from '../data';
import { getAllSRSStates } from '../storage/cardStateStorage';
import { getWeakCards, getWorkingSet } from './cardUtils';
import { getAllGrammarForLevels } from '../data/grammar';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = 'https://kedlkijfsmnguwjgffip.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gemini-chat`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  teacherNote?: string;
}

interface ProgressContext {
  levels: number[];
  workingCards: VocabCard[];
  weakCards: Array<VocabCard & { efactor: number; lapses: number }>;
  grammarPatterns: string[];
}

async function getProgressContext(settings: AppSettings): Promise<ProgressContext> {
  const levels = settings.exerciseLevelFilter ?? settings.activeLevels;
  const allCards: VocabCard[] = [];
  const allIds: string[] = [];
  for (const level of levels) {
    allCards.push(...getCardsForLevel(level));
    allIds.push(...getAllCardIds(level));
  }
  const states = await getAllSRSStates(allIds);

  const workingCards = getWorkingSet(allCards, states, settings.workingSetSize);
  const weakCards = getWeakCards(allCards, states, 10);
  const grammarRules = getAllGrammarForLevels(levels);
  const grammarPatterns = grammarRules.slice(0, 8).map(r => `${r.pattern} (${r.title})`);

  return { levels, workingCards, weakCards, grammarPatterns };
}

function buildSystemPrompt(ctx: ProgressContext, useTraditional: boolean): string {
  const charType = useTraditional ? 'traditional' : 'simplified';

  const vocabList = ctx.workingCards.slice(0, 15).map(c => {
    const ch = useTraditional ? c.traditional : c.simplified;
    return `${ch} (${c.pinyin}) - ${c.english}`;
  }).join('\n');

  const weakList = ctx.weakCards.slice(0, 8).map(c => {
    const ch = useTraditional ? c.traditional : c.simplified;
    return `${ch} (${c.pinyin}) - ${c.english} [struggles with this]`;
  }).join('\n');

  const grammarList = ctx.grammarPatterns.join('\n');

  return `You are a friendly Chinese language conversation partner and teacher for an HSK ${ctx.levels.join('/')} student.

RULES:
1. Always respond in valid JSON with exactly two fields: "reply" and "teacher"
2. "reply" is your natural conversational response IN CHINESE (${charType} characters) with pinyin in parentheses after each sentence. Keep it conversational and natural — like texting a Chinese friend. Use vocabulary appropriate to HSK ${ctx.levels.join('/')} level. Naturally weave in the target vocabulary below when it fits the conversation.
3. "teacher" is an English analysis section for the student. Include:
   - What the student did well (if they wrote Chinese)
   - Any grammar or vocabulary mistakes and corrections
   - Key vocabulary/grammar from your reply explained
   - Alternative ways to express the same idea
   - Cultural notes if relevant
4. If the student writes in English, respond in Chinese anyway and encourage them to try Chinese next time in your teacher note.
5. Prioritize testing the student on their WEAK words by using them in context.
6. Keep responses concise — 1-3 sentences for the reply, 3-6 bullet points for teacher notes.

TARGET VOCABULARY (student is currently learning):
${vocabList}

WEAK VOCABULARY (student struggles with these — use them more):
${weakList}

GRAMMAR PATTERNS (currently studying):
${grammarList}

IMPORTANT: Your entire response must be valid JSON. Nothing else. Example:
{"reply":"你好！今天你想聊什么？(Nǐ hǎo! Jīntiān nǐ xiǎng liáo shénme?)","teacher":"- **你好** (nǐ hǎo) = hello\\n- **今天** (jīntiān) = today\\n- **聊** (liáo) = to chat\\n- This is a common casual greeting to start a conversation."}`;
}

function buildEdgeMessages(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage?: string,
): Array<{ role: string; text: string }> {
  const messages: Array<{ role: string; text: string }> = [];

  // System prompt as first user message (Gemini doesn't have a system role)
  const greetingAppend = history.length === 0 && !userMessage
    ? '\n\nPlease greet me to start our conversation. Remember to respond in JSON format with "reply" and "teacher" fields.'
    : '\n\nPlease greet me to start our conversation.';

  messages.push({ role: 'user', text: systemPrompt + greetingAppend });

  // Add conversation history
  if (history.length > 0 && history[0].role === 'assistant') {
    messages.push({
      role: 'assistant',
      text: JSON.stringify({ reply: history[0].text, teacher: history[0].teacherNote ?? '' }),
    });
    for (let i = 1; i < history.length; i++) {
      const msg = history[i];
      if (msg.role === 'user') {
        messages.push({ role: 'user', text: msg.text });
      } else {
        messages.push({
          role: 'assistant',
          text: JSON.stringify({ reply: msg.text, teacher: msg.teacherNote ?? '' }),
        });
      }
    }
  } else {
    for (const msg of history) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', text: msg.text });
      } else {
        messages.push({
          role: 'assistant',
          text: JSON.stringify({ reply: msg.text, teacher: msg.teacherNote ?? '' }),
        });
      }
    }
  }

  // Add current user message if provided
  if (userMessage) {
    messages.push({ role: 'user', text: userMessage });
  }

  return messages;
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in to use AI Chat');
  return token;
}

async function callEdgeFunction(
  messages: Array<{ role: string; text: string }>,
): Promise<{ reply: string; teacher: string }> {
  const token = await getAuthToken();

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errData.error ?? `Server error (${response.status})`);
  }

  const data = await response.json();
  return {
    reply: data.reply ?? '',
    teacher: data.teacher ?? '',
  };
}

export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string,
  settings: AppSettings,
): Promise<{ reply: string; teacher: string }> {
  const ctx = await getProgressContext(settings);
  const systemPrompt = buildSystemPrompt(ctx, settings.useTraditional);
  const messages = buildEdgeMessages(systemPrompt, history, userMessage);
  return callEdgeFunction(messages);
}

export async function startChat(
  settings: AppSettings,
): Promise<{ reply: string; teacher: string }> {
  const ctx = await getProgressContext(settings);
  const systemPrompt = buildSystemPrompt(ctx, settings.useTraditional);
  const messages = buildEdgeMessages(systemPrompt, [], undefined);
  return callEdgeFunction(messages);
}
