"use client";

import { getCurrentStudent } from "@/lib/student";

export type ListKey = "L1" | "L2" | "L3";
export const LIST_KEYS: ListKey[] = ["L1", "L2", "L3"];

function storageKey(): string {
  return `tunafen:listelerim:${getCurrentStudent()}`;
}

type ListsState = Record<ListKey, number[]>;

function emptyState(): ListsState {
  return { L1: [], L2: [], L3: [] };
}

export function readLists(): ListsState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(storageKey());
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { L1: parsed.L1 ?? [], L2: parsed.L2 ?? [], L3: parsed.L3 ?? [] };
  } catch {
    return emptyState();
  }
}

function writeLists(state: ListsState) {
  window.localStorage.setItem(storageKey(), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("tunafen-lists-changed"));
}

export function isInList(programId: number, key: ListKey): boolean {
  return readLists()[key].includes(programId);
}

export function toggleInList(programId: number, key: ListKey): boolean {
  const state = readLists();
  const has = state[key].includes(programId);
  state[key] = has ? state[key].filter((id) => id !== programId) : [...state[key], programId];
  writeLists(state);
  return !has;
}

export function removeFromList(programId: number, key: ListKey) {
  const state = readLists();
  state[key] = state[key].filter((id) => id !== programId);
  writeLists(state);
}

export function subscribeLists(callback: () => void): () => void {
  window.addEventListener("tunafen-lists-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("tunafen-lists-changed", callback);
    window.removeEventListener("storage", callback);
  };
}
