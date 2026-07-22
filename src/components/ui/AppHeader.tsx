import Link from "next/link";
import { HomeNavLink } from "@/components/ui/HomeNavLink";
import { Logo } from "@/components/ui/Logo";
import { StudentSwitcher } from "@/components/ui/StudentSwitcher";
import { cn } from "@/lib/cn";

interface NavItem {
  href: "/" | "/ai-danisman" | "/listelerim";
  label: string;
  shortLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Ara", shortLabel: "Ara" },
  { href: "/ai-danisman", label: "AI Danışman", shortLabel: "AI" },
  { href: "/listelerim", label: "Listelerim", shortLabel: "Liste" },
];

export function AppHeader({
  active,
  subtitle,
  extra,
}: {
  active: "/" | "/ai-danisman" | "/listelerim";
  subtitle?: string;
  extra?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Logo size={34} />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-semibold tracking-tight text-foreground">Tunafen Tercih Robotu</div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              {subtitle ?? "2026 YKS üniversite tercih motoru"}
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <nav className="flex items-center gap-0.5 rounded-full border border-border bg-surface-muted p-1 sm:gap-1">
            {NAV_ITEMS.map((item) => {
              const linkClassName = cn(
                "rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:px-3.5 sm:text-sm",
                active === item.href
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              );
              const content = (
                <>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
                </>
              );
              return item.href === "/" ? (
                <HomeNavLink key={item.href} className={linkClassName}>
                  {content}
                </HomeNavLink>
              ) : (
                <Link key={item.href} href={item.href} className={linkClassName}>
                  {content}
                </Link>
              );
            })}
          </nav>
          <StudentSwitcher />
          {extra}
        </div>
      </div>
    </header>
  );
}
