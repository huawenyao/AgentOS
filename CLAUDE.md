# CLAUDE.md

## What is this project?

**Agentic Work Studio** — a conversation-driven AI workspace. Users describe business tasks in natural language; the AI plans, executes, and generates dynamic visualizations as thinking aids.

## Architecture (2 layers)

```
studio/          Python backend (FastAPI)
├── api/         HTTP endpoints (sessions, connections, tools, agents, metrics)
├── engine/      Core engines
│   ├── session_engine.py    ← THE CORE: conversation loop + visual generation
│   ├── agent_runtime.py     ReAct loop with constraints
│   ├── tool_executor.py     HTTP/SQL/Python tool execution with retry
│   ├── rule_engine.py       Safe expression evaluation
│   └── workflow_engine.py   Internal DAG scheduler (not user-facing)
├── gateway/     LLM gateway (Anthropic + OpenAI, rate limiting, cost tracking)
├── connect/     OpenAPI import → auto-generate tools
├── observe/     Audit log (hash chain) + Tracer + Metrics
├── models/      SQLAlchemy models (Connection, Tool, Agent, Workflow, Run)
└── config.py    Settings from env vars

web/             React frontend (TypeScript)
├── pages/
│   ├── Workbench.tsx        ← THE PRODUCT: chat + insights panel
│   ├── ConnectHub.tsx       Config: data source management
│   ├── AgentDesigner.tsx    Config: agent management + playground
│   └── MeasureDashboard.tsx Metrics overview
├── components/
│   └── DynamicVisual.tsx    10-type visualization renderer with click-to-ask
└── services/api.ts          API client
```

## Key commands

```bash
# Backend
pip install -e .
uvicorn studio.api.main:app --reload --port 8000

# Frontend
cd web && npm install && npm start

# Infrastructure
docker-compose up -d   # PostgreSQL + Redis
```

## Design principles

1. **Session is primary** — `/api/sessions/chat` is the main endpoint. Everything else is config.
2. **AI generates visuals, not users** — No drag-and-drop canvas. AI calls `render_visual` proactively.
3. **Click-to-ask** — Users click visual elements to ask follow-up questions.
4. **Constraints are first-class** — Every agent has cost/timeout/approval limits.
5. **Cost is transparent** — Every LLM call is tracked and surfaced to the user.

## Adding a new tool

1. Create a `Connection` via `/api/connections`
2. Upload OpenAPI spec via `/api/connections/{id}/import-openapi`
3. Tools auto-appear in the session engine

## Adding a new visualization type

1. Add to `RENDER_VISUAL_TOOL.input_schema.properties.visual_type.enum` in `session_engine.py`
2. Add data schema description to the `data` property
3. Add renderer in `DynamicVisual.tsx`
