# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Frontend dashboard for UPTC energy consumption analysis. Built with React + TypeScript following Hexagonal Architecture, Screaming Architecture, and Vertical Slice patterns.

## Commands

```bash
# Start development server (port 5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm tsc --noEmit

# Lint
pnpm lint
```

## Architecture

### Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **Charts**: ECharts (echarts-for-react)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Validation**: Zod
- **Routing**: React Router v7

### Directory Structure

```
src/
├── config/                    # App configuration
│   └── api.config.ts          # API endpoints and settings
├── core/                      # Core/shared infrastructure
│   ├── domain/                # Shared domain types
│   ├── infrastructure/
│   │   └── http/              # Axios client and interceptors
│   └── shared/
│       ├── types/             # Shared TypeScript types
│       └── utils/             # Error handling utilities
├── features/                  # Feature modules (Screaming Architecture)
│   └── consulta/              # Energy consumption query feature
│       ├── domain/
│       │   ├── entities/      # Domain entities (pure TS)
│       │   └── interfaces/    # Ports (repository interfaces)
│       ├── application/
│       │   ├── dto/           # Zod schemas for validation
│       │   └── store/         # Zustand store
│       ├── infrastructure/
│       │   └── HttpConsultaRepository.ts  # Axios adapter
│       └── presentation/
│           ├── components/    # React components
│           ├── hooks/         # Custom hooks
│           └── pages/         # Page components
├── shared/
│   └── components/
│       └── ui/                # Shared UI components
└── App.tsx                    # Router setup
```

### Key Architecture Rules

1. **Hexagonal (Ports & Adapters)**
   - Domain has NO external dependencies (no React, Axios, Zustand)
   - Interfaces (ports) live in `domain/interfaces/`
   - Implementations (adapters) live in `infrastructure/`

2. **Vertical Slice**
   - Each feature is self-contained with its own domain/application/infrastructure/presentation
   - Features do NOT import from other features except shared types

3. **Screaming Architecture**
   - Folder names "scream" the business domain: `consulta`, not `data`
   - Business logic goes inside features, not generic `components/`

4. **Type Safety with Zod**
   - All API responses validated with Zod schemas
   - Types inferred from schemas using `z.infer<typeof Schema>`

5. **Zustand Patterns**
   - Store per feature in `feature/application/store/`
   - Stores call repository methods, never Axios directly

### Data Flow

```
UI Component → Custom Hook → Zustand Store → Repository (Port) → HttpRepository (Adapter) → Axios → API
```

### API Configuration

The API base URL is configured in `.env`:
```
VITE_API_URL=http://localhost:3000
```

### Charts

Uses ECharts for heavy data visualization with:
- Interactive zoom (dataZoom)
- Tooltips
- Multiple chart types: Line, Bar, Pie, Radar

### Available API Endpoints

Consumes the UPTC Energy API:
- `GET /sedes` - Campus locations
- `GET /consumos` - Energy readings with filters
- `GET /stats/diario` - Daily aggregation
- `GET /stats/sector` - Sector breakdown
- `GET /stats/horario` - Hourly patterns
- `GET /stats/periodo` - Academic period stats
- `GET /stats/summary` - Overall summary
