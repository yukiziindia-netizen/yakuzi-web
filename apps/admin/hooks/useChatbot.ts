"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listChatbotTrainings, createChatbotTraining, updateChatbotTraining, deleteChatbotTraining,
  deleteAllChatbotTrainings, reorderChatbotTrainings,
  type ChatbotTrainingTier,
} from "@/api/chatbot.api";

const KEY = ["admin", "chatbot", "trainings"];

export function useChatbotTrainings() {
  return useQuery({ queryKey: KEY, queryFn: listChatbotTrainings, staleTime: 30_000, retry: 1 });
}

export function useCreateChatbotTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChatbotTraining,
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateChatbotTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateChatbotTraining>[1] }) =>
      updateChatbotTraining(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChatbotTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChatbotTraining,
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAllChatbotTrainings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAllChatbotTrainings,
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReorderChatbotTrainings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tier, orderedIds }: { tier: ChatbotTrainingTier; orderedIds: string[] }) =>
      reorderChatbotTrainings(tier, orderedIds),
    onMutate: async ({ tier, orderedIds }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Awaited<ReturnType<typeof listChatbotTrainings>>>(KEY);
      if (previous) {
        const byId = new Map(previous.map((t) => [t.id, t]));
        const reordered = orderedIds
          .map((id, index) => {
            const t = byId.get(id);
            return t ? { ...t, order: index } : undefined;
          })
          .filter((t): t is NonNullable<typeof t> => !!t);
        const others = previous.filter((t) => t.tier !== tier);
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
