# Video Prompt Optimizer - Application Architecture

## Overview

The Video Prompt Optimizer is a full-stack web application built for analyzing and optimizing video production prompts. It features a React frontend with TypeScript, an Express.js backend, and PostgreSQL database integration using Drizzle ORM. The application provides real-time prompt analysis, multi-scene management, and optimization suggestions entirely through client-side processing.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React hooks and context for local state
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Development**: tsx for TypeScript execution during development
- **Production**: esbuild for optimized server bundle compilation

### Database Layer
- **Database**: PostgreSQL (configured for deployment)
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless driver for cloud connectivity
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Client-Side Analysis Engine
The application performs all prompt analysis locally without external API calls:

1. **PromptAnalyzer Class** (`client/src/utils/promptAnalyzer.ts`)
   - Sentiment analysis using keyword matching
   - Topic detection through predefined keyword clusters
   - Readability scoring via Flesch-Kincaid formula
   - Named entity recognition for pronunciation warnings

2. **PromptOptimizer Class** (`client/src/utils/promptOptimizer.ts`)
   - Rule-based prompt enhancement
   - Motion verb injection for video prompts
   - Educational keyword addition for voice scripts
   - Length optimization for different prompt types

### Scene Management System
- Multi-scene input interface with dynamic scene creation
- Real-time analysis scoring for each scene
- Bulk operations for CSV import/export
- Scene reordering and deletion capabilities

### User Interface Components
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Dark Mode Support**: System preference detection with manual override
- **Accessibility**: ARIA labels and keyboard navigation support
- **Component Library**: Comprehensive shadcn/ui component set

## Data Flow

### Prompt Analysis Workflow
1. User inputs prompt text for image, video, or voice
2. Debounced input triggers local analysis engine
3. Analysis engine processes text through multiple heuristics
4. Results are scored and categorized by readiness level
5. UI displays color-coded feedback and actionable suggestions

### Scene Management Flow
1. Users create scenes with prompts and narration
2. Each scene receives individual analysis scoring
3. Module-level averages computed for overall project health
4. CSV export/import enables batch operations
5. Optimization suggestions applied through rule-based fixes

### Development vs Production
- **Development**: Vite dev server with HMR and React Fast Refresh
- **Production**: Static asset serving with Express fallback routing
- **Build Process**: Client bundle optimization and server compilation

## External Dependencies

### Core Frontend Libraries
- React ecosystem (React, React DOM, React Query)
- UI components (Radix UI primitives, Lucide React icons)
- Form handling (React Hook Form with Zod validation)
- Styling (Tailwind CSS, class-variance-authority, clsx)
- Date utilities (date-fns)
- Carousel (Embla Carousel React)

### Backend Dependencies
- Express.js for server framework
- Drizzle ORM with PostgreSQL dialect
- Neon serverless database driver
- Session management (connect-pg-simple)
- Development tooling (tsx, esbuild)

### Build and Development Tools
- Vite with React plugin and runtime error overlay
- TypeScript for type safety
- Replit-specific development enhancements
- PostCSS with Tailwind and Autoprefixer

## Deployment Strategy

### Replit Platform Configuration
- **Environment**: Node.js 20, Web, PostgreSQL 16 modules
- **Development Command**: `npm run dev` (tsx server with Vite)
- **Production Build**: Client Vite build + server esbuild compilation
- **Production Start**: `npm run start` (compiled server bundle)

### Port Configuration
- **Local Port**: 5000 (development server)
- **External Port**: 80 (production deployment)
- **Auto-scaling**: Configured for Replit's autoscale deployment target

### Database Setup
- PostgreSQL connection via DATABASE_URL environment variable
- Drizzle migrations in `./migrations` directory
- Schema definition in `./shared/schema.ts`
- Push command: `npm run db:push` for schema synchronization

### File Structure Organization
```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared types and schema
├── migrations/      # Database migration files
└── dist/           # Production build output
```

## Changelog

Changelog:
- June 15, 2025. Initial setup
- June 15, 2025. Enhanced Video Prompt Optimizer with optimized prompt display, individual copy buttons for image/voice prompts, percentage score formatting, and improved UI layout
- June 15, 2025. Added comprehensive privacy notice emphasizing 100% local processing, no data collection, and complete user privacy protection
- June 15, 2025. Implemented full undo/redo functionality with history tracking (50 actions), keyboard shortcuts (Ctrl+Z/Ctrl+Y), and visual controls in toolbar

## User Preferences

Preferred communication style: Simple, everyday language.