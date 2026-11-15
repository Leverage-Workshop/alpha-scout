import "server-only";
import {
  matchTeam,
  pickTeamNews,
  type EspnArticle,
  type EspnTeam,
  type TeamReport,
} from "./team-report";

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const TIMEOUT_MS = 5000;
const NEWS_FETCH_LIMIT = 20;

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`ESPN request failed with status ${res.status}`);
  }
  return res.json();
}

type TeamsResponse = { sports?: { leagues?: { teams?: { team: EspnTeam }[] }[] }[] };

type TeamDetail = {
  team?: {
    record?: { items?: { type?: string; summary?: string }[] };
    standingSummary?: string;
    nextEvent?: { name?: string; date?: string }[];
  };
};

async function listTeams(): Promise<EspnTeam[]> {
  const data = (await fetchJson("/teams")) as TeamsResponse;
  return data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => t.team) ?? [];
}

/**
 * Looks up an NFL team's current record, standing, next game and recent news from ESPN's
 * public site API. Unofficial and unauthenticated: fine for experiments, not a licensed feed.
 */
export async function getTeamReport(query: string): Promise<TeamReport> {
  const match = matchTeam(await listTeams(), query);
  if (match.status !== "found") {
    return match;
  }
  const { team } = match;
  const id = encodeURIComponent(team.id);

  const [detail, news] = await Promise.all([
    fetchJson(`/teams/${id}`) as Promise<TeamDetail>,
    fetchJson(`/news?team=${id}&limit=${NEWS_FETCH_LIMIT}`) as Promise<{ articles?: EspnArticle[] }>,
  ]);

  const records = detail.team?.record?.items ?? [];
  const recordOf = (type: string) => records.find((r) => r.type === type)?.summary ?? null;
  const next = detail.team?.nextEvent?.[0];

  return {
    status: "found",
    team: { name: team.displayName, abbreviation: team.abbreviation },
    record: { overall: recordOf("total"), home: recordOf("home"), road: recordOf("road") },
    standing: detail.team?.standingSummary ?? null,
    nextGame: next?.name ? { name: next.name, date: next.date ?? null } : null,
    news: pickTeamNews(news.articles ?? [], team.id),
    source: "ESPN",
  };
}
