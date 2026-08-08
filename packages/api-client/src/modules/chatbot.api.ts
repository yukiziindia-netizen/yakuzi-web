import { api } from '../api';

export interface ChatMessage {
  role: 'user' | 'assistant' | string;
  content: string;
  thoughts?: string;
  thinkingTimeMs?: number;
  attachments?: { name: string; data: string; type: string }[];
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  attachments?: { name: string; data: string; type: string }[];
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
}

export interface ChatResponse {
  response: string;
  thoughts?: string;
  thinkingTimeMs?: number;
}

export async function sendChatMessageFull(
  message: string, 
  history: ChatMessage[] = [],
  attachments?: { name: string; data: string; type: string }[],
  options?: { thinkingEnabled?: boolean; thinkingBudget?: number }
): Promise<ChatResponse> {
  try {
    const { data } = await api.post<ChatResponse>('/chatbot/chat', {
      message,
      history,
      attachments,
      thinkingEnabled: options?.thinkingEnabled ?? true,
      thinkingBudget: options?.thinkingBudget ?? 2048,
    });
    return data;
  } catch (err) {
    console.warn('[Chatbot] Failed to send message:', err);
    throw err;
  }
}

export async function sendChatMessage(
  message: string, 
  history: ChatMessage[] = [],
  attachments?: { name: string; data: string; type: string }[],
  options?: { thinkingEnabled?: boolean; thinkingBudget?: number }
): Promise<string> {
  const res = await sendChatMessageFull(message, history, attachments, options);
  return res.response;
}
