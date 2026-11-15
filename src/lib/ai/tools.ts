import "server-only";
import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";
import { getTeamReport } from "@/lib/sports/espn";

export const tools = {
  getTeamReport: tool({
    description:
      "Look up an NFL team's current season record (overall, home, road), division standing, " +
      "next game, and a few recent news headlines. Use this whenever the user asks how an NFL " +
      "team is doing.",
    inputSchema: z.object({
      team: z
        .string()
        .trim()
        .min(1)
        .max(60)
        .describe('Team name, nickname, city or abbreviation, e.g. "Eagles" or "KC"'),
    }),
    execute: async ({ team }) => getTeamReport(team),
  }),
};

export type ChatMessage = UIMessage<never, never, InferUITools<typeof tools>>;
