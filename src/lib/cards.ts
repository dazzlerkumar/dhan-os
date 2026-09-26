export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function clampDay(year: number, month: number, day: number): number {
  const maxDays = getDaysInMonth(year, month);
  return Math.min(day, maxDays);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getStatementDate(
  year: number,
  month: number,
  statementDay: number,
): string {
  const day = clampDay(year, month, statementDay);
  return formatDate(year, month, day);
}

export function getPreviousDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function normalizeCycleMonth(cycleMonth: string): string | null {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(cycleMonth)) {
    return `${cycleMonth}-01`;
  }
  if (/^\d{4}-(0[1-9]|1[0-2])-01$/.test(cycleMonth)) {
    return cycleMonth;
  }
  return null;
}

export function formatMonthNameYear(dateStr: string): string {
  const [year, month] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getCycleWindowForCycleMonth(
  cycleMonth: string,
  statementDay: number,
): { start: string; end: string } {
  const [targetYear, targetMonth] = cycleMonth.split("-").map(Number);
  const thisCycleStatementDate = getStatementDate(
    targetYear,
    targetMonth,
    statementDay,
  );

  const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
  const prevCycleStatementDate = getStatementDate(
    prevYear,
    prevMonth,
    statementDay,
  );

  return {
    start: prevCycleStatementDate,
    end: getPreviousDay(thisCycleStatementDate),
  };
}

export function getCurrentCycleInfo(
  statementDay: number,
  asOfDate?: string,
): {
  currentCycleWindow: { start: string; end: string };
  mostRecentCycleMonth: string;
} {
  const todayStr = asOfDate || new Date().toISOString().slice(0, 10);
  const [todayY, todayM] = todayStr.split("-").map(Number);

  const stmtThisMonth = getStatementDate(todayY, todayM, statementDay);

  if (todayStr >= stmtThisMonth) {
    const mostRecentCycleMonth = formatDate(todayY, todayM, 1);
    const nextY = todayM === 12 ? todayY + 1 : todayY;
    const nextM = todayM === 12 ? 1 : todayM + 1;
    const nextStmtDate = getStatementDate(nextY, nextM, statementDay);

    return {
      currentCycleWindow: {
        start: stmtThisMonth,
        end: getPreviousDay(nextStmtDate),
      },
      mostRecentCycleMonth,
    };
  }

  const prevY = todayM === 1 ? todayY - 1 : todayY;
  const prevM = todayM === 1 ? 12 : todayM - 1;
  const mostRecentCycleMonth = formatDate(prevY, prevM, 1);
  const prevStmtDate = getStatementDate(prevY, prevM, statementDay);

  return {
    currentCycleWindow: {
      start: prevStmtDate,
      end: getPreviousDay(stmtThisMonth),
    },
    mostRecentCycleMonth,
  };
}
