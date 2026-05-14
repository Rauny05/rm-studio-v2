"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useKanbanStore } from "@/store/kanban-store";
import { useEffect } from "react";
import type { Board, Card } from "@/types/kanban";

// ── Query keys ────────────────────────────────────────────────────────────────

export const kanbanKeys = {
  all: ["kanban"] as const,
  boards: () => [...kanbanKeys.all, "boards"] as const,
  board: (id: string) => [...kanbanKeys.boards(), id] as const,
};

// ── Fetch all boards (server → Zustand hydration) ─────────────────────────────

async function fetchBoards() {
  const res = await fetch("/api/kanban/boards");
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json() as Promise<{ boards: ServerBoard[] }>;
}

// Server board shape (flat DB records with nested columns/cards)
interface ServerCard {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description: string;
  deliverableType: string | null;
  thumbnailUrl: string | null;
  videoLink: string | null;
  tags: unknown;
  priority: string;
  dueDate: string | null;
  notes: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ServerColumn {
  id: string;
  boardId: string;
  title: string;
  order: number;
  cards: ServerCard[];
}

interface ServerBoard {
  id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  order: number;
  columns: ServerColumn[];
  createdAt: string;
  updatedAt: string;
}

// ── Transform server response → Zustand shape ─────────────────────────────────

function normalizeServerData(serverBoards: ServerBoard[]) {
  const boards: Board[] = [];
  const columns: Record<string, import("@/types/kanban").Column> = {};
  const cards: Record<string, Card> = {};

  for (const sb of serverBoards) {
    boards.push({
      id: sb.id,
      title: sb.title,
      description: sb.description,
      color: sb.color,
      emoji: sb.emoji,
      columnIds: sb.columns.map((c) => c.id),
      createdAt: sb.createdAt,
      updatedAt: sb.updatedAt,
    });

    for (const sc of sb.columns) {
      columns[sc.id] = {
        id: sc.id,
        title: sc.title,
        cardIds: sc.cards.map((c) => c.id),
      };

      for (const card of sc.cards) {
        cards[card.id] = {
          id: card.id,
          columnId: card.columnId,
          boardId: card.boardId,
          title: card.title,
          description: card.description,
          deliverableType: card.deliverableType as Card["deliverableType"],
          thumbnailUrl: card.thumbnailUrl,
          videoLink: card.videoLink,
          tags: Array.isArray(card.tags) ? card.tags : [],
          priority: card.priority as Card["priority"],
          dueDate: card.dueDate,
          notes: card.notes,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        };
      }
    }
  }

  return { boards, columns, cards };
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useKanbanSync() {
  const hydrateFromServer = useKanbanStore((s) => s.hydrateFromServer);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: kanbanKeys.boards(),
    queryFn: fetchBoards,
  });

  // Hydrate Zustand from server data
  useEffect(() => {
    if (data?.boards) {
      const normalized = normalizeServerData(data.boards);
      hydrateFromServer(normalized);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return { isLoading, isError, queryClient };
}

// ── Card mutations ────────────────────────────────────────────────────────────

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      columnId: string;
      boardId: string;
      title: string;
      description?: string;
      deliverableType?: string | null;
      priority?: string;
      dueDate?: string | null;
      tags?: unknown[];
      notes?: string;
    }) => {
      const res = await fetch("/api/kanban/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
    },
    onError: (_, payload) => {
      // Revert optimistic update by refetching
      console.error("Card creation failed, reverting", payload);
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      updates,
    }: {
      cardId: string;
      updates: Partial<Card> & { columnId?: string; order?: number };
    }) => {
      const res = await fetch(`/api/kanban/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const res = await fetch(`/api/kanban/cards/${cardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
    },
  });
}

// ── Board mutations ───────────────────────────────────────────────────────────

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      color?: string;
      emoji?: string;
    }) => {
      const res = await fetch("/api/kanban/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create board");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const res = await fetch(`/api/kanban/boards/${boardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete board");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
    },
  });
}
