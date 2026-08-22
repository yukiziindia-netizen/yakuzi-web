"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listChatbotRules, createChatbotRule, updateChatbotRule, deleteChatbotRule, extractChatbotRule,
} from "@/api/chatbot.api";

export function useChatbotRules() {
  return useQuery({ queryKey: ["admin", "chatbot", "rules"], queryFn: listChatbotRules, staleTime: 30_000, retry: 1 });
}

export function useCreateChatbotRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChatbotRule,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "chatbot", "rules"] }),
  });
}

export function useUpdateChatbotRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateChatbotRule>[1] }) =>
      updateChatbotRule(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "chatbot", "rules"] }),
  });
}

export function useDeleteChatbotRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChatbotRule,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "chatbot", "rules"] }),
  });
}

export function useExtractChatbotRule() {
  return useMutation({ mutationFn: extractChatbotRule });
}
