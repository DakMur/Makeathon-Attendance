import { Team } from './types';

export interface SearchCategorizedResults {
  startsWith: Team[];
  contains: Team[];
  all: Team[];
}

/**
 * Filter and prioritize teams based on search query.
 * Rule: Teams starting with the query appear first,
 * followed by teams that contain the query.
 * Teams not matching at all are excluded.
 */
export function getOptimizedSearchResults(
  teams: Team[],
  rawQuery?: string | null
): SearchCategorizedResults {
  const query = (rawQuery || '').trim().toLowerCase();

  if (!query) {
    return {
      startsWith: teams,
      contains: [],
      all: teams,
    };
  }

  const isNumeric = /^\d+$/.test(query);

  const startsWithList: Team[] = [];
  const containsList: Team[] = [];
  const seenSlNos = new Set<number>();

  // 1. Check for exact or prefix number match if query is numeric
  if (isNumeric) {
    const num = parseInt(query, 10);
    // Exact match
    const exact = teams.find((t) => t.sl_no === num);
    if (exact) {
      startsWithList.push(exact);
      seenSlNos.add(exact.sl_no);
    }

    // Number prefix match (e.g. typing "1" matches 10..19)
    teams.forEach((t) => {
      if (!seenSlNos.has(t.sl_no) && String(t.sl_no).startsWith(query)) {
        startsWithList.push(t);
        seenSlNos.add(t.sl_no);
      }
    });
  }

  // 2. Check team names strictly starting with the query
  teams.forEach((t) => {
    if (seenSlNos.has(t.sl_no)) return;
    const name = t.team_name.toLowerCase();
    if (name.startsWith(query)) {
      startsWithList.push(t);
      seenSlNos.add(t.sl_no);
    }
  });

  // 3a. Check if any subsequent word in team_name starts with the query
  // e.g. Query "A" -> "Team Alpha" or "SPARK AI" (has word starting with A)
  teams.forEach((t) => {
    if (seenSlNos.has(t.sl_no)) return;
    const words = t.team_name.toLowerCase().split(/\s+/);
    if (words.some((w) => w.startsWith(query))) {
      containsList.push(t);
      seenSlNos.add(t.sl_no);
    }
  });

  // 3b. Check if team_name contains the query (anywhere in characters)
  teams.forEach((t) => {
    if (seenSlNos.has(t.sl_no)) return;
    const name = t.team_name.toLowerCase();
    if (name.includes(query)) {
      containsList.push(t);
      seenSlNos.add(t.sl_no);
    }
  });

  // 4. Check if any member name starts with the query
  teams.forEach((t) => {
    if (seenSlNos.has(t.sl_no)) return;
    const members = [t.member_1, t.member_2, t.member_3, t.member_4].filter(Boolean);
    const memberStartsWith = members.some((m) => {
      const parts = m.toLowerCase().split(/\s+/);
      return parts.some((p) => p.startsWith(query));
    });
    if (memberStartsWith) {
      containsList.push(t);
      seenSlNos.add(t.sl_no);
    }
  });

  // 5. Check if any member name contains the query
  teams.forEach((t) => {
    if (seenSlNos.has(t.sl_no)) return;
    const members = [t.member_1, t.member_2, t.member_3, t.member_4].filter(Boolean);
    const memberContains = members.some((m) => m.toLowerCase().includes(query));
    if (memberContains) {
      containsList.push(t);
      seenSlNos.add(t.sl_no);
    }
  });

  return {
    startsWith: startsWithList,
    contains: containsList,
    all: [...startsWithList, ...containsList],
  };
}
