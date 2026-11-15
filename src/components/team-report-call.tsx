import type { ChatMessage } from "@/lib/ai/tools";

type TeamReportPart = Extract<ChatMessage["parts"][number], { type: "tool-getTeamReport" }>;

function summarize(part: TeamReportPart): string {
  const team = part.input?.team ?? "team";
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return `Looking up ${team}…`;
    case "output-error":
      return `Couldn't look up ${team}`;
    case "output-available": {
      const out = part.output;
      if (out.status === "found") {
        const record = out.record.overall ? ` (${out.record.overall})` : "";
        return `Looked up ${out.team.name}${record}`;
      }
      if (out.status === "ambiguous") return `"${team}" matched several teams`;
      return `No NFL team matched "${team}"`;
    }
    default:
      return `Looking up ${team}`;
  }
}

/** Compact, expandable view of a getTeamReport tool call so the user can see what ran. */
export function TeamReportCall({ part }: { part: TeamReportPart }) {
  const done = part.state === "output-available" || part.state === "output-error";
  return (
    <details className="rounded-md border border-current/15 px-3 py-2 text-sm">
      <summary className="cursor-pointer select-none opacity-80">
        <span aria-hidden className="mr-1">
          {done ? "🔧" : "⏳"}
        </span>
        <code className="mr-2 text-xs opacity-70">getTeamReport</code>
        {summarize(part)}
      </summary>
      <pre className="mt-2 max-h-64 overflow-auto text-xs whitespace-pre-wrap opacity-80">
        {JSON.stringify(
          part.state === "output-error"
            ? { input: part.input, error: part.errorText }
            : { input: part.input, output: "output" in part ? part.output : undefined },
          null,
          2,
        )}
      </pre>
    </details>
  );
}
