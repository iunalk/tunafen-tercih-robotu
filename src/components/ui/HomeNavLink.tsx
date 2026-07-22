"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { readLastSearch } from "@/lib/searchState";

/** "Ara" linkine tıklanınca, varsa son yapılan aramaya (filtre/sayfa) geri döner. */
export function HomeNavLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        const lastSearch = readLastSearch();
        router.push(`/${lastSearch}`);
      }}
    >
      {children}
    </Link>
  );
}
