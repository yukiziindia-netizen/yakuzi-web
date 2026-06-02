import { api } from '../api';

export interface ChatMessage {
  role: 'user' | 'assistant' | string;
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<string> {
  try {
    const { data } = await api.post<ChatResponse>('/chatbot/chat', {
      message,
      history,
    });
    return data.response;
  } catch (err) {
    console.warn('[Chatbot] Failed to send message:', err);
    throw err;
  }
}
