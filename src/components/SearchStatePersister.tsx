"use client";

import { useEffect } from "react";
import { saveLastSearch } from "@/lib/searchState";

/** Ana sayfadaki mevcut filtre/sıralama/sayfa durumunu localStorage'a kaydeder,
 * böylece başka sekmeye gidip geri dönünce arama kaldığı yerden devam eder. */
export function SearchStatePersister() {
  useEffect(() => {
    saveLastSearch(window.location.search);
  });
  return null;
}
