"use client";

const CURRENT_KEY = "tunafen:currentStudent";
const KNOWN_KEY = "tunafen:knownStudents";
export const DEFAULT_STUDENT = "Misafir";

export function getCurrentStudent(): string {
  if (typeof window === "undefined") return DEFAULT_STUDENT;
  return window.localStorage.getItem(CURRENT_KEY) || DEFAULT_STUDENT;
}

export function getKnownStudents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KNOWN_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return list.filter((n) => n !== DEFAULT_STUDENT);
  } catch {
    return [];
  }
}

export function setCurrentStudent(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  window.localStorage.setItem(CURRENT_KEY, trimmed);
  const known = new Set(getKnownStudents());
  known.add(trimmed);
  window.localStorage.setItem(KNOWN_KEY, JSON.stringify([...known]));
  window.dispatchEvent(new CustomEvent("tunafen-lists-changed"));
  window.dispatchEvent(new CustomEvent("tunafen-student-changed"));
}

export function subscribeStudent(callback: () => void): () => void {
  window.addEventListener("tunafen-student-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("tunafen-student-changed", callback);
    window.removeEventListener("storage", callback);
  };
}
