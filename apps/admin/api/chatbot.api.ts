import { apiClient } from "@/lib/apiClient";

// Client for the merged rules-based training backend (api#68 + api#72):
// distilled trigger→instruction rules stored in Postgres, pulled by the
// Gemini sidecar on every chat. Tier/order/delete-all/reorder need api#72.

export type ChatbotRuleTier = "CORE" | "SURFACE";

export interface ChatbotRule {
  id: string;
  trigger: string;
  instruction: string;
  isActive: boolean;
  tier: ChatbotRuleTier;
  order: number;
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
  tier?: ChatbotRuleTier;
}): Promise<ChatbotRule> {
  const { data } = await apiClient.post<{ data: ChatbotRule }>("/admin/chatbot/rules", payload);
  return data.data;
}

export async function updateChatbotRule(
  id: string,
  payload: Partial<{ trigger: string; instruction: string; isActive: boolean; tier: ChatbotRuleTier; order: number }>,
): Promise<ChatbotRule> {
  const { data } = await apiClient.patch<{ data: ChatbotRule }>(`/admin/chatbot/rules/${id}`, payload);
  return data.data;
}

export async function deleteChatbotRule(id: string): Promise<void> {
  await apiClient.delete(`/admin/chatbot/rules/${id}`);
}

export async function deleteAllChatbotRules(): Promise<void> {
  await apiClient.delete("/admin/chatbot/rules");
}

export async function reorderChatbotRules(
  tier: ChatbotRuleTier,
  orderedIds: string[],
): Promise<ChatbotRule[]> {
  const { data } = await apiClient.patch<{ data: ChatbotRule[] }>("/admin/chatbot/rules/reorder", {
    tier,
    orderedIds,
  });
  return data.data;
}

export interface ExtractedRuleDraft {
  trigger: string;
  instruction: string;
}

/** Distills a sandbox conversation into an editable rule draft via Gemini.
 * Returns the sidecar payload directly — NOT wrapped in { data }. */
export async function extractChatbotRule(
  history: { role: string; content?: string }[],
): Promise<ExtractedRuleDraft> {
  const { data } = await apiClient.post<ExtractedRuleDraft>("/chatbot/train/extract", { history });
  return data;
}
