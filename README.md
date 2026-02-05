# HDS Workflow Tool

A guided PRD generation tool for healthcare design sprints. Helps students progress through 7 design phases, each with AI-assisted synthesis and iteration.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude API (via backend proxy)
- **Design System:** MDP (Medical Design Program) tokens
- **Font:** JetBrains Mono

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.local.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.local.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `ANTHROPIC_API_KEY` - Claude API key
- `GITHUB_TOKEN` - GitHub personal access token for artifact commits

## Project Structure

```
src/
  app/                 # Next.js App Router pages
  components/          # React components
    ui/               # shadcn/ui components
  lib/                # Utilities and clients
    prompts/          # AI prompt templates (for review)
    supabase.ts       # Supabase client
    utils.ts          # shadcn utilities
  types/              # TypeScript definitions
  fonts/              # Local fonts
```

## License

Private - UVA Medical Design Program
