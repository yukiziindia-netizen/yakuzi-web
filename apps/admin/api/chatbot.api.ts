import { apiClient } from "@/lib/apiClient";

export type ChatbotTrainingTier = "CORE" | "SURFACE";

export interface ChatbotTrainingMessage {
  role: string;
  content?: string;
}

export interface ChatbotTraining {
  id: string;
  label: string | null;
  tier: ChatbotTrainingTier;
  order: number;
  history: ChatbotTrainingMessage[];
  createdAt: string;
  updatedAt: string;
}

export async function listChatbotTrainings(): Promise<ChatbotTraining[]> {
  const { data } = await apiClient.get<{ data: ChatbotTraining[] }>("/admin/chatbot/trainings");
  return data.data;
}

export async function createChatbotTraining(payload: {
  history: ChatbotTrainingMessage[];
  tier?: ChatbotTrainingTier;
  label?: string;
}): Promise<ChatbotTraining> {
  const { data } = await apiClient.post<{ data: ChatbotTraining }>("/admin/chatbot/trainings", payload);
  return data.data;
}

export async function updateChatbotTraining(
  id: string,
  payload: Partial<{ tier: ChatbotTrainingTier; order: number; label: string }>,
): Promise<ChatbotTraining> {
  const { data } = await apiClient.patch<{ data: ChatbotTraining }>(`/admin/chatbot/trainings/${id}`, payload);
  return data.data;
}

export async function deleteChatbotTraining(id: string): Promise<void> {
  await apiClient.delete(`/admin/chatbot/trainings/${id}`);
}

export async function deleteAllChatbotTrainings(): Promise<void> {
  await apiClient.delete("/admin/chatbot/trainings");
}

export async function reorderChatbotTrainings(
  tier: ChatbotTrainingTier,
  orderedIds: string[],
): Promise<ChatbotTraining[]> {
  const { data } = await apiClient.patch<{ data: ChatbotTraining[] }>("/admin/chatbot/trainings/reorder", {
    tier,
    orderedIds,
  });
  return data.data;
}
