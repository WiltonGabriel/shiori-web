import { create } from "zustand";
import type { BroadcastResponse } from "../types/admin.types";

interface BroadcastState {
  broadcasts: BroadcastResponse[];
  dismissedIds: number[];
  setBroadcasts: (broadcasts: BroadcastResponse[]) => void;
  dismissBroadcast: (id: number) => void;
}

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
  broadcasts: [],
  dismissedIds: JSON.parse(sessionStorage.getItem("shiori_dismissed_broadcasts") || "[]"),

  setBroadcasts: (broadcasts) => set({ broadcasts }),

  dismissBroadcast: (id: number) => {
    const updated = [...get().dismissedIds, id];
    sessionStorage.setItem("shiori_dismissed_broadcasts", JSON.stringify(updated));
    set({ dismissedIds: updated });
  },
}));
