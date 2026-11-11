# Alpha Scout — Product Requirements Document

**Status:** Draft v0.2 — technical foundation only  
**Last updated:** 2026-11-10  
**Owner:** Leverage Workshop  
**Implementation target:** Claude Code / new standalone Next.js application  
**Reference application:** https://github.com/Leverage-Workshop/roux-tutor

> **Document boundary:** This version captures the agreed concept and technology choices. The precise research experience, data model, search/retrieval design, and MVP scope are intentionally **TBD** until the product owner describes the intended workflow. Treat future-looking architecture notes as design considerations, not approved feature requirements.

## 1. Product overview

**Name:** Alpha Scout (working name)

**Concept:** A trading research application that provides a RAG-like search experience over historical market price data. Its purpose is to help a trader investigate and evaluate trade setups using retrieved historical evidence.

**Product positioning:** Research and evidence gathering, not an autonomous trading or order execution system.

### Goals (initial)

- Build on the same modern web application stack as Roux Tutor, minus the Rubik's Cube-specific graphics and vision components.
- Store time-series market price data in **Aiven PostgreSQL with the TimescaleDB extension** enabled.
- Use **Vercel AI SDK** and **Vercel AI Gateway** for model integration, leaving the model and retrieval design undecided.
- Create an extensible foundation for the research and retrieval workflow to be specified next.

### Not yet defined

- Primary users and supported markets/instruments.
- How users describe or submit a setup/query.
- Meaning of “RAG-like” for structured numerical price data; retrieval and ranking algorithms.
- Data vendors, frequency/granularity, history depth, ingest schedule, and data licensing.
- Analyses, statistics, visualizations, explanations, and result formats.
- Saved searches, workspaces, authentication, subscriptions, or multi-user support.
- Production deployment details and MVP success criteria.

## 2. Technology stack

The versions below reflect the Roux Tutor `main` branch inspected on 2026-11-07. Use the same major stack and development conventions; when bootstrapping, pin known-compatible versions rather than blindly upgrading packages.

| Layer | Choice | Notes |
|---|---|---|
| Runtime | **Node.js 24.x** | Matches Roux Tutor's `engines` and `.nvmrc` |
| Framework | **Next.js 16.4.3** | App Router / server-side endpoints and pages |
| View layer | **React 19.3.1**, React DOM 19.3.1 | Matches reference |
| Language | **TypeScript 5.x** | Strict typing recommended |
| Styling | **Tailwind CSS 4.x** | Matches reference |
| UI primitives | **@base-ui/react 1.9.x** | Accessible unstyled components |
| Client state | **Zustand 5.x** | Use where cross-component interactive state is needed |
| Database | **Aiven PostgreSQL + TimescaleDB extension** | Aiven Free initially; validate extension and capacity during setup |
| AI integration | **Vercel AI SDK** (`ai`) | TypeScript API for generation, streaming, tool calls, structured outputs |
| AI model gateway | **Vercel AI Gateway** | Unified model routing/authentication; model(s) TBD |
| Tests | **Vitest 5.x**, React Testing Library 16.x, Testing Library DOM 10.x, jsdom 30.x | Match reference test approach |
| Lint/typecheck | **ESLint 10.x**, `eslint-config-next` 16.4.3, TypeScript | Match reference |
| Deployment | **Vercel** | Intended web hosting, same as Roux Tutor |
| DNS | **Cloudflare** | Same DNS approach as Roux Tutor; domain TBD |
| Package manager | **npm** with committed `package-lock.json` | Matches reference |

### Do not carry over from Roux Tutor

- Three.js, React Three Fiber, `@react-three/drei`, or WebGL cube renderer.
- Cube algorithms or `cubejs`.
- OpenCV.js, camera scanning, color detection, or cube-related canvas code.
- Cube-specific interfaces, settings, and product language.

### Additional packages — intentionally unselected

Choose these only after the workflow is described:

- Database driver / query layer / migrations (e.g., `pg`, Drizzle, or other).
- Market data ingestion adapters and background job runner.
- Specific LLM/model(s) available via Vercel AI Gateway and embedding strategy/provider, if any.
- Vector similarity extension (`pgvector`) **only if** embeddings are actually needed.
- Charting library, if price visualization is part of the workflow.
- Authentication or billing libraries, if needed.

**Important distinction:** TimescaleDB optimizes time-series storage and queries; it does not automatically provide semantic retrieval, embeddings, or RAG orchestration. Numerical pattern matching may be a better fit than text embeddings for parts of the product. Keep retrieval strategy open.

## 3. Database and TimescaleDB requirements

### Confirmed requirements

1. Use PostgreSQL as the primary application database.
2. Install and enable the `timescaledb` extension in the application database.
3. Run on a PostgreSQL host and version that explicitly support TimescaleDB; do not assume every generic managed PostgreSQL service supports installing it.
4. Manage database initialization and schema changes with committed, repeatable migrations.
5. Make the development environment reproducible (prefer a Docker Compose setup using a TimescaleDB-enabled PostgreSQL image).
6. Keep database credentials server-side in environment variables; never expose them via `NEXT_PUBLIC_*`.
7. Add automated verification that the extension is enabled in local development and the chosen production database.

### Extension enablement (after server has TimescaleDB installed)

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT extname, extversion
FROM pg_extension
WHERE extname = 'timescaledb';
```

This SQL **enables** the extension in a database; it does **not** install TimescaleDB server binaries. Local Docker image / production provider must already supply and support the extension, including required preload configuration. The initial setup should document which PostgreSQL and TimescaleDB versions are in use.

### Time-series modeling guidelines (provisional)

- Expect time-indexed price observations to be strong candidates for TimescaleDB hypertables, once exact instrument/timeframe/source semantics are defined.
- Define canonical timestamp conventions (store UTC, with exchange/trading-session time zones handled explicitly).
- Determine price precision and numeric types based on chosen markets, tick sizes, and data feed.
- Define uniqueness and deduplication rules for instrument, feed, resolution, and timestamp before ingesting data.
- Make source/provenance, gaps, revisions, and session boundaries explicit.
- Defer compression/columnstore, retention, continuous aggregates, and indexes until query shape and data volume are known.
- Confirm that unique indexes on hypertables include partitioning columns where required.

### Chosen managed database provider: Aiven

- **Provider:** Aiven (selected for Alpha Scout).
- **Initial tier:** Aiven Free PostgreSQL; free-tier storage, availability, and extension limitations must be verified at provisioning time.
- **Upgrade path:** Aiven Developer or another suitable paid Aiven plan if storage, uptime, or workload requires it.
- **Connection:** Server-only PostgreSQL connection string and TLS settings in environment variables (e.g., `DATABASE_URL`); never commit secrets.
- **Provisioning checks:** Confirm supported PostgreSQL version, TimescaleDB extension availability, hypertable support, applicable TimescaleDB feature/license limitations, and connection pooling limits on the actual instance.
- **Inactivity:** Free services may power off after prolonged inactivity; do not assume always-on behavior. Document restart and backup/recovery procedures.

**Do not select Supabase by default:** its 2026 documentation reports TimescaleDB deprecation for Postgres 17 projects (with legacy support for Postgres 15). Vercel hosts the Next.js application, not the Aiven database.

## 4. Vercel AI SDK and AI Gateway requirements

### Confirmed decisions

1. Use **Vercel AI SDK** (npm package `ai`) as the server-side TypeScript abstraction for LLM interaction.
2. Route application model requests through **Vercel AI Gateway** instead of directly coupling product code to one model vendor.
3. Support model selection through configuration; **do not choose a default production model yet**. Verify model IDs against the Gateway catalog during implementation.
4. Keep model calls on the server in Next.js route handlers/server modules. Never expose Gateway credentials to the browser.
5. Support streaming responses and structured output/tool calling **where the eventual user experience calls for them**; do not prebuild speculative chat features.
6. Keep retrieval and numeric/statistical analysis separate from model-generated narrative. A model must not invent matching historical examples or performance statistics.
7. Define appropriate token/cost limits, timeouts, failures, input validation, and logging when the workflow is specified. Do not log secrets or sensitive prompts inadvertently.

### Installation and authentication

```bash
npm install ai
```

For local development, a Gateway API key can be provided through an uncommitted `.env.local` file:

```dotenv
# .env.example (placeholder; do not paste actual secrets)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require
AI_GATEWAY_API_KEY=your_gateway_key_here
```

Vercel deployments may use Vercel-managed **OIDC** authentication to AI Gateway; a server-side `AI_GATEWAY_API_KEY` is a documented alternative. Pick the deployment-specific authentication method during setup, and never require both simultaneously. With AI Gateway as default provider, the AI SDK accepts a `provider/model` string for generation:

```ts
import { generateText } from 'ai';

// Illustrative only; configure a valid Gateway model ID at implementation time.
const result = await generateText({
  model: process.env.AI_MODEL_ID!,
  prompt: 'Summarize the supplied, verified research results.',
});
```

Do not send unrestricted database connections or raw SQL execution authority to a model. Any research tools should validate input, constrain query scope, and return grounded results with provenance.

### Architecture boundaries (provisional)

- **Aiven + TimescaleDB:** storage and retrieval of factual price observations.
- **Application research services:** deterministic filters, calculations, rankings, and reproducible queries (details TBD).
- **AI SDK:** validated model interaction / orchestration and response formatting.
- **AI Gateway:** model routing and authentication; model choice TBD.
- **Next.js UI:** user interaction and display of source-backed evidence; interface TBD.

The term “RAG-like” does not yet imply vector embeddings or a chatbot. These are still product-design decisions.

## 5. Proposed project organization (starting point, not a final design)

```text
alpha-scout/
├── docs/
│   └── PRODUCT.md                 # This PRD
├── src/
│   ├── app/                       # Next.js routes, layouts, endpoints
│   ├── components/                # Shared UI
│   ├── lib/
│   │   ├── db/                    # DB connection / migrations helpers
│   │   ├── ai/                    # Vercel AI SDK / Gateway integration
│   │   ├── market-data/           # TBD: ingestion and normalization
│   │   └── research/              # TBD: retrieval and analysis
│   └── store/                     # Zustand stores, if needed
├── db/
│   └── migrations/                # Versioned SQL/schema migrations
├── tests/                         # Automated tests (or colocate)
├── .env.example                   # Placeholder names, no secrets
├── AGENTS.md                      # Coding-agent conventions
├── CLAUDE.md                      # Claude Code entrypoint
├── package.json
└── package-lock.json
```

Avoid building placeholder market-data and research modules until their contracts are defined; this tree indicates likely boundaries only.

## 6. Development and engineering conventions

- Use Next.js App Router with server-side access to database credentials.
- Separate data ingestion, query/retrieval, analytics, and UI concerns so they can be tested independently.
- Validate all user-supplied query inputs at API boundaries.
- Parameterize database queries; never interpolate untrusted text into SQL.
- Prefer deterministic, testable computation for price/statistical outputs; any LLM-generated narrative must not be treated as the source of numeric truth.
- Maintain traceability from any reported research result to the exact historical data and calculation that produced it.
- Add unit tests for market-data normalization, time boundaries, statistical calculations, and retrieval once those requirements are defined.
- Include `dev`, `build`, `lint`, `typecheck`, and `test` scripts similar to Roux Tutor.
- Document local startup, DB initialization, migrations, and checks in the README / `AGENTS.md`.

## 7. Functional requirements — awaiting product-owner outline

**7.1 Research interaction** — TBD  
How a user formulates a question or setup, filters data, and iterates.

**7.2 Historical data** — TBD  
Markets, instruments, timeframes, vendors, import mechanisms, and coverage.

**7.3 Retrieval/search** — TBD  
Definition of similarity, screening criteria, candidate selection, indexing, and ranking.

**7.4 Evaluation and statistical outputs** — TBD  
Trade/setup definitions, comparison cohorts, forward returns, risk, sample sizes, and confidence.

**7.5 Results presentation** — TBD  
Evidence, charts, tables, saved analysis, exports, and explanations.

**7.6 User/accounts** — TBD  
Initial access model; private single-user vs multi-user.

**7.7 Operational controls** — TBD  
Data refreshes, observability, jobs, costs, and production support.

## 8. Scope and milestones

### Phase 0 — foundation (approved technical direction)

- [ ] Bootstrap a new Next.js / React / TypeScript application using the referenced versions and conventions.
- [ ] Configure Tailwind, Base UI, and Zustand (when needed).
- [ ] Configure TypeScript, linting, Vitest, and testing-library support.
- [ ] Create a local TimescaleDB-capable PostgreSQL environment.
- [ ] Add a migration that enables `timescaledb` and a test/health check that verifies it.
- [ ] Add `.env.example` and local setup instructions.
- [ ] Provision **Aiven PostgreSQL Free**, confirm TimescaleDB support, and document its version/limits.
- [ ] Install Vercel AI SDK (`ai`) and configure secure Vercel AI Gateway authentication.
- [ ] Add a minimal server-side Gateway connectivity smoke test without selecting a product model yet.

### Phase 1 — product definition (next conversation)

- [ ] Describe the envisioned user workflow, ideally with a sample research question and expected result.
- [ ] Specify available/input price data and target instruments.
- [ ] Agree on the retrieval approach and evaluation methodology.
- [ ] Define MVP UI and feature acceptance criteria.
- [ ] Convert the approved workflow into implementation milestones and tests.

**Not authorized by this PRD:** Assume a specific AI model or embedding design, embed every candle into vectors, execute live orders, ingest real market data, or build speculative research features before the requirements are specified.

## 9. Questions to settle in the next revision

1. What does the user type or select when asking Alpha Scout to research a setup?
2. What should the answer contain: matching occurrences, example charts, probabilities, forward performance, or something else?
3. Which historical prices are available (NQ, other futures, stocks, etc.) and at what granularity?
4. Are patterns described in natural language, structured conditions, a chart selection, or some combination?
5. How will Alpha Scout decide which historical periods are similar or relevant?
6. Is the initial deployment single-user or intended for multiple users?

## 10. Reference materials

- Roux Tutor repository: https://github.com/Leverage-Workshop/roux-tutor
- Roux Tutor dependency manifest: https://github.com/Leverage-Workshop/roux-tutor/blob/main/package.json
- Roux Tutor product document: https://github.com/Leverage-Workshop/roux-tutor/blob/main/docs/PRODUCT.md
- Roux Tutor agent guidance: https://github.com/Leverage-Workshop/roux-tutor/blob/main/AGENTS.md
- TimescaleDB installation: https://www.tigerdata.com/docs/get-started/choose-your-path/install-timescaledb
- Aiven Free PostgreSQL: https://aiven.io/free-postgresql-database
- Vercel AI SDK: https://ai-sdk.dev/docs
- Vercel AI Gateway: https://vercel.com/docs/ai-gateway
- Gateway authentication: https://vercel.com/docs/ai-gateway/authentication-and-byok
- Supabase TimescaleDB compatibility note: https://supabase.com/docs/guides/database/extensions/timescaledb

---

*Next action: incorporate the product owner's description of the Alpha Scout research workflow. Do not infer functional requirements from the architecture alone.*
