"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listChatbotRules, createChatbotRule, updateChatbotRule, deleteChatbotRule,
  deleteAllChatbotRules, reorderChatbotRules, extractChatbotRule,
  type ChatbotRuleTier,
} from "@/api/chatbot.api";

const KEY = ["admin", "chatbot", "rules"];

export function useChatbotRules() {
  return useQuery({ queryKey: KEY, queryFn: listChatbotRules, staleTime: 30_000, retry: 1 });
}

export function useCreateChatbotRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChatbotRule,
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateChatbotRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateChatbotRule>[1] }) =>
      updateChatbotRule(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChatbotRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChatbotRule,
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAllChatbotRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAllChatbotRules,
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useExtractChatbotRule() {
  return useMutation({ mutationFn: extractChatbotRule });
}

export function useReorderChatbotRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tier, orderedIds }: { tier: ChatbotRuleTier; orderedIds: string[] }) =>
      reorderChatbotRules(tier, orderedIds),
    onMutate: async ({ tier, orderedIds }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Awaited<ReturnType<typeof listChatbotRules>>>(KEY);
      if (previous) {
        const byId = new Map(previous.map((r) => [r.id, r]));
        const reordered = orderedIds
          .map((id, index) => {
            const r = byId.get(id);
            return r ? { ...r, order: index } : undefined;
          })
          .filter((r): r is NonNullable<typeof r> => !!r);
        const others = previous.filter((r) => r.tier !== tier);
        qc.setQueryData(KEY, [...others, ...reordered]);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEY, context.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}
