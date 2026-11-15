import { describe, expect, test } from "vitest";
import { matchTeam, pickTeamNews, type EspnArticle, type EspnTeam } from "./team-report";

const team = (id: string, location: string, nickname: string, abbreviation: string): EspnTeam => ({
  id,
  displayName: `${location} ${nickname}`,
  shortDisplayName: nickname,
  location,
  abbreviation,
});

const TEAMS = [
  team("21", "Philadelphia", "Eagles", "PHI"),
  team("12", "Kansas City", "Chiefs", "KC"),
  team("19", "New York", "Giants", "NYG"),
  team("20", "New York", "Jets", "NYJ"),
];

describe("matchTeam", () => {
  test.each([
    ["Eagles", "Philadelphia Eagles"],
    ["eagles", "Philadelphia Eagles"],
    ["PHI", "Philadelphia Eagles"],
    ["Philadelphia", "Philadelphia Eagles"],
    ["philly eagles", "Philadelphia Eagles"],
    ["the Kansas City Chiefs", "Kansas City Chiefs"],
    ["kc", "Kansas City Chiefs"],
  ])("matches %j to %s", (query, name) => {
    const result = matchTeam(TEAMS, query);
    expect(result.status === "found" && result.team.displayName).toBe(name);
  });

  test("reports ambiguity for a shared city", () => {
    expect(matchTeam(TEAMS, "New York")).toEqual({
      status: "ambiguous",
      query: "New York",
      candidates: ["New York Giants", "New York Jets"],
    });
  });

  test.each(["Manchester United", "", "  "])("does not match %j", (query) => {
    expect(matchTeam(TEAMS, query).status).toBe("not_found");
  });
});

describe("pickTeamNews", () => {
  const article = (headline: string, teamIds: number[]): EspnArticle => ({
    headline,
    description: `${headline} summary`,
    published: "2026-11-14T00:00:00Z",
    links: { web: { href: `https://example.com/${headline}` } },
    categories: teamIds.map((teamId) => ({ type: "team", teamId })),
  });

  test("prefers team-focused stories over league-wide roundups", () => {
    const news = pickTeamNews(
      [
        article("Week 10 odds", [1, 2, 3, 4, 21]),
        article("Eagles release WR", [21]),
        article("Bengals and Eagles trade", [4, 21]),
        article("Chiefs win", [12]),
      ],
      "21",
    );
    expect(news.map((n) => n.headline)).toEqual(["Eagles release WR", "Bengals and Eagles trade"]);
    expect(news[0]).toEqual({
      headline: "Eagles release WR",
      summary: "Eagles release WR summary",
      published: "2026-11-14T00:00:00Z",
      url: "https://example.com/Eagles release WR",
    });
  });

  test("falls back to any headlines when none are team-focused", () => {
    const news = pickTeamNews([article("League roundup", [1, 2, 3, 4])], "21");
    expect(news.map((n) => n.headline)).toEqual(["League roundup"]);
  });

  test("caps the number of headlines", () => {
    const many = Array.from({ length: 10 }, (_, i) => article(`Story ${i}`, [21]));
    expect(pickTeamNews(many, "21")).toHaveLength(5);
  });
});
