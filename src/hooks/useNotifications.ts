"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Notification } from "@prisma/client";

const QUERY_KEY = ["notifications"];

interface NotificationsResponse {
  notifications: Notification[];
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  const data: NotificationsResponse = await res.json();
  return data.notifications;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchNotifications,
    // Poll every 30s as fallback when Ably is not available
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Ably real-time subscription — enhances polling, works without key
  const channelRef = useRef<import("ably").RealtimeChannel | null>(null);

  useEffect(() => {
    let mounted = true;

    async function subscribeAbly() {
      try {
        // Dynamic import so the module only loads client-side
        const { getAblyClient } = await import("@/lib/ably");
        const client = getAblyClient();
        if (!client || !mounted) return;

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          client.connection.once("connected", () => resolve());
          client.connection.once("failed", () => reject(new Error("Ably connection failed")));
        });

        if (!mounted) return;

        // We need the userId — get it from the session via a minimal API call
        // rather than adding a dependency on useSession (avoids provider coupling)
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok || !mounted) return;
        const session = await sessionRes.json();
        const userId = session?.user?.id;
        if (!userId || !mounted) return;

        const channelName = `notifications:${userId}`;
        const channel = client.channels.get(channelName);
        channelRef.current = channel;

        await channel.subscribe("new-notification", () => {
          if (mounted) {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          }
        });
      } catch {
        // Ably unavailable — polling fallback is already active
      }
    }

    subscribeAbly();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return { notifications, unreadCount, isLoading };
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark notification as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
