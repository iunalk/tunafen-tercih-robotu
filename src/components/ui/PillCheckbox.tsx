export function PillCheckbox({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="group cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium
          text-muted-foreground transition-all select-none
          hover:border-border-strong hover:text-foreground
          peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-checked:font-semibold
          peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface"
      >
        {children}
      </span>
    </label>
  );
}
