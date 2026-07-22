"use client";

const LAST_SEARCH_KEY = "tunafen:lastSearch";

export function saveLastSearch(search: string) {
  window.localStorage.setItem(LAST_SEARCH_KEY, search);
}

export function readLastSearch(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(LAST_SEARCH_KEY) ?? "";
}
