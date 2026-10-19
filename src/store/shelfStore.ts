import { create } from "zustand";
import type { StatusLeitura, ItemCatalogoResponse } from "../types/catalog.types";

export type ShelfFilter = StatusLeitura | "TODOS";

interface ShelfState {
  filter: ShelfFilter;
  searchQuery: string;
  selectedItem: ItemCatalogoResponse | null;
  setFilter: (filter: ShelfFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedItem: (item: ItemCatalogoResponse | null) => void;
}

export const useShelfStore = create<ShelfState>((set) => ({
  filter: "TODOS",
  searchQuery: "",
  selectedItem: null,
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
}));
