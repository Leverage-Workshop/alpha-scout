/** Pure helpers for the NFL team report tool (no network), so they can be unit tested. */

export type EspnTeam = {
  id: string;
  displayName: string;
  shortDisplayName: string;
  location: string;
  abbreviation: string;
};

export type EspnArticle = {
  headline?: string;
  description?: string;
  published?: string;
  links?: { web?: { href?: string } };
  categories?: { type?: string; teamId?: number | string }[];
};

export type NewsItem = {
  headline: string;
  summary: string | null;
  published: string | null;
  url: string | null;
};

export type TeamMatch =
  | { status: "found"; team: EspnTeam }
  | { status: "ambiguous"; query: string; candidates: string[] }
  | { status: "not_found"; query: string };

export type TeamReport =
  | Exclude<TeamMatch, { status: "found" }>
  | {
      status: "found";
      team: { name: string; abbreviation: string };
      record: { overall: string | null; home: string | null; road: string | null };
      standing: string | null;
      nextGame: { name: string; date: string | null } | null;
      news: NewsItem[];
      source: "ESPN";
    };

const MAX_NEWS = 5;
/** Articles tagged with more teams than this are league-wide roundups, not team news. */
const MAX_TEAMS_FOR_TEAM_STORY = 3;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Matches a free-text team name ("Eagles", "philly eagles", "PHI", "Kansas City") to one team. */
export function matchTeam(teams: EspnTeam[], query: string): TeamMatch {
  const q = normalize(query);
  if (!q) {
    return { status: "not_found", query };
  }

  const exact = teams.filter((t) =>
    [t.displayName, t.shortDisplayName, t.location, t.abbreviation].map(normalize).includes(q),
  );
  const matches =
    exact.length > 0
      ? exact
      : teams.filter(
          (t) => normalize(t.displayName).includes(q) || q.includes(normalize(t.shortDisplayName)),
        );

  const [only] = matches;
  if (matches.length === 1 && only) {
    return { status: "found", team: only };
  }
  if (matches.length > 1) {
    return { status: "ambiguous", query, candidates: matches.map((t) => t.displayName) };
  }
  return { status: "not_found", query };
}

function toNewsItem(a: EspnArticle): NewsItem {
  return {
    headline: a.headline ?? "",
    summary: a.description ?? null,
    published: a.published ?? null,
    url: a.links?.web?.href ?? null,
  };
}

/** Prefers stories about this team over league-wide roundups that tag every team. */
export function pickTeamNews(articles: EspnArticle[], teamId: string): NewsItem[] {
  const teamIdsOf = (a: EspnArticle) =>
    (a.categories ?? []).filter((c) => c.type === "team").map((c) => String(c.teamId));

  const focused = articles.filter((a) => {
    const ids = teamIdsOf(a);
    return ids.includes(teamId) && ids.length <= MAX_TEAMS_FOR_TEAM_STORY;
  });
  const chosen = focused.length > 0 ? focused : articles;

  return chosen
    .filter((a) => a.headline)
    .slice(0, MAX_NEWS)
    .map(toNewsItem);
}
