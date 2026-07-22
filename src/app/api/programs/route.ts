import { NextRequest, NextResponse } from "next/server";
import { CURRENT_YEAR, HISTORY_YEARS } from "@/lib/search";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));

  if (ids.length === 0) {
    return NextResponse.json({ programs: [] });
  }

  const programs = await prisma.program.findMany({
    where: { id: { in: ids } },
    include: {
      university: true,
      yearlyStats: { where: { year: { in: [CURRENT_YEAR, ...HISTORY_YEARS] } } },
    },
  });

  return NextResponse.json({ programs });
}
