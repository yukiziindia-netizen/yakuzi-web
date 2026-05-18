'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@pharmabag/api-client';

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        // Try the bulk operation first
        return await markAllAsRead();
      } catch (err: any) {
        // If bulk fails (e.g., 404/405 not implemented), fall back to individual marking
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          const notificationsData: any = queryClient.getQueryData(['notifications']);
          const unreadIds = notificationsData?.data
            ?.filter((n: any) => !n.isRead && !n.read)
            ?.map((n: any) => n.id) ?? [];
          
          if (unreadIds.length > 0) {
            console.log(`[Notifications] Bulk read failed, falling back to ${unreadIds.length} individual requests.`);
            // Mark all individually in parallel
            await Promise.allSettled(unreadIds.map((id: string) => markAsRead(id)));
          }
          return;
        }
        throw err;
      }
    },
    onMutate: async () => {
      // Cancel refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      const previousData = queryClient.getQueryData(['notifications']);
      
      // Optimistically update
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: 0,
          data: old.data?.map((n: any) => ({ ...n, isRead: true, read: true })) ?? [],
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications'], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
