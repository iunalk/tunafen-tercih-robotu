import { SearchStatePersister } from "@/components/SearchStatePersister";
import { AppHeader } from "@/components/ui/AppHeader";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { getFilterOptions, parseFilters, searchPrograms, type RawSearchParams } from "@/lib/search";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);

  const [{ cities, universities, departments }, { total, programs, totalPages }] = await Promise.all([
    getFilterOptions(filters),
    searchPrograms(filters),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <SearchStatePersister />
      <AppHeader active="/" />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-start">
        <div className="min-w-0 print:hidden lg:sticky lg:top-[76px] lg:w-80 lg:shrink-0">
          <FilterPanel filters={filters} cities={cities} universities={universities} departments={departments} />
        </div>
        <ResultsTable filters={filters} programs={programs} total={total} totalPages={totalPages} />
      </main>
    </div>
  );
}
