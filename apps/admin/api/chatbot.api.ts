import { apiClient } from "@/lib/apiClient";

export interface ChatbotRule {
  id: string;
  trigger: string;
  instruction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listChatbotRules(): Promise<ChatbotRule[]> {
  const { data } = await apiClient.get<{ data: ChatbotRule[] }>("/admin/chatbot/rules");
  return data.data;
}

export async function createChatbotRule(payload: {
  trigger: string;
  instruction: string;
}): Promise<ChatbotRule> {
  const { data } = await apiClient.post<{ data: ChatbotRule }>("/admin/chatbot/rules", payload);
  return data.data;
}

export async function updateChatbotRule(
  id: string,
  payload: Partial<{ trigger: string; instruction: string; isActive: boolean }>,
): Promise<ChatbotRule> {
  const { data } = await apiClient.patch<{ data: ChatbotRule }>(`/admin/chatbot/rules/${id}`, payload);
  return data.data;
}

export async function deleteChatbotRule(id: string): Promise<void> {
  await apiClient.delete(`/admin/chatbot/rules/${id}`);
}

export interface ExtractedRuleDraft {
  trigger: string;
  instruction: string;
}

export async function extractChatbotRule(
  history: { role: string; content?: string }[],
): Promise<ExtractedRuleDraft> {
  const { data } = await apiClient.post<ExtractedRuleDraft>("/chatbot/train/extract", { history });
  return data;
}
