export function SegmentedRadio({
  name,
  options,
}: {
  name: string;
  options: { value: string; label: string; defaultChecked?: boolean }[];
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-border bg-surface-muted p-1">
      {options.map((opt) => (
        <label key={opt.value || "all"} className="group flex-1 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            defaultChecked={opt.defaultChecked}
            className="peer sr-only"
          />
          <span
            className="flex items-center justify-center rounded-md px-3 py-1.5 text-center text-xs font-medium text-muted-foreground
              transition-all select-none
              peer-checked:bg-surface peer-checked:text-foreground peer-checked:shadow-sm
              peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}
