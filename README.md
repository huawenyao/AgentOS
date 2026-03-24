# Agentic Work Studio

**Say what you need. AI works. Visuals help you think.**

An AI workspace where business professionals describe tasks in natural language. The AI autonomously plans, executes, and generates dynamic visualizations as thinking aids — revealing structure, trends, relationships, and options the user might not see on their own.

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Start backend
pip install -e .
uvicorn studio.api.main:app --reload --port 8000

# 3. Start frontend
cd web && npm install && npm start
```

Open http://localhost:3000 and start talking.

## How it works

```
You say: "分析上月客户投诉，找出主要问题"

AI does:
  1. Queries your complaint database
  2. Categorizes 847 complaints
  3. Generates a mind map → shows problem structure
  4. Generates a bar chart → shows category distribution
  5. Generates a causal network → shows root causes
  6. Summarizes findings and recommends actions

You see: text explanation + 3 dynamic visualizations
You say: "产品质量那个分支展开看看"
AI goes deeper...
```

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React + Ant Design + Recharts + ReactFlow | Conversation + dynamic visual panel |
| **API** | FastAPI (async) | Session streaming (SSE) + config CRUD |
| **Engine** | Session Engine + Agent Runtime | LLM orchestration + tool execution |
| **Gateway** | Anthropic + OpenAI SDK | Multi-model routing + rate limiting + cost tracking |
| **Storage** | PostgreSQL + Redis | Persistent state + caching |

## Product Philosophy

- **Conversation is primary.** Users don't draw workflows. They talk.
- **Visuals are AI's externalized thinking.** Generated proactively to serve a thinking purpose.
- **Click-to-ask.** Every visualization element is a doorway to deeper analysis.
- **Zero setup to start.** Type a question on first visit. Configuration comes later.

## Project Structure

```
studio/           Backend (Python)
├── api/          FastAPI routes
├── engine/       Session engine, agent runtime, tool executor
├── gateway/      LLM gateway
├── connect/      OpenAPI importer
├── observe/      Audit, tracing, metrics
└── models/       Database models

web/              Frontend (React + TypeScript)
├── pages/        Workbench, Connect, Agents, Measure
└── components/   DynamicVisual (10 chart types)

docs/             Product design documents
docker-compose.yml
pyproject.toml
```

## License

MIT
