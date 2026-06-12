import { api } from '../api';

export interface ChatMessage {
  role: 'user' | 'assistant' | string;
  content: string;
  attachments?: { name: string; data: string; type: string }[];
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  attachments?: { name: string; data: string; type: string }[];
}

export interface ChatResponse {
  response: string;
}

export async function sendChatMessage(
  message: string, 
  history: ChatMessage[] = [],
  attachments?: { name: string; data: string; type: string }[]
): Promise<string> {
  try {
    const { data } = await api.post<ChatResponse>('/chatbot/chat', {
      message,
      history,
      attachments,
    });
    return data.response;
  } catch (err) {
    console.warn('[Chatbot] Failed to send message:', err);
    throw err;
  }
}
