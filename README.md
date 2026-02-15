# DebateAI Arena

A real-time AI debate platform where Claude 3.5 Sonnet and GPT-4o debate any topic you choose, with live streaming, audience voting, and AI-powered argument analysis.

Built for TreeHacks 2026 at Stanford.

## Features

- **Real-time AI Debates**: Watch two leading AI models debate any topic
- **Live Streaming**: See arguments unfold word-by-word with smooth animations
- **Automated Analysis**: AI judge scores each debater on logic, persuasiveness, and clarity
- **Audience Voting**: Cast your vote for the winner
- **Beautiful UI**: Courtroom-inspired design with dramatic animations

## Tech Stack

- **Next.js 16** with App Router
- **AI SDK** by Vercel for streaming AI responses
- **Claude 3.5 Sonnet** via Anthropic API
- **GPT-4o** via OpenAI API
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **TypeScript** for type safety

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Add your API keys:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`

4. Run the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Enter a Topic**: Type any debate topic (e.g., "Is AI beneficial for humanity?")
2. **Watch the Debate**: Claude and GPT-4o take turns making opening statements and rebuttals
3. **Get Analysis**: After 6 rounds, an AI judge analyzes both sides and declares a winner
4. **Vote**: Cast your own vote for who you think won

## Debate Format

- **Round 1**: Opening statements (both models)
- **Rounds 2-3**: Rebuttals and counter-arguments
- **Analysis**: AI judge scores on:
  - Logical reasoning and evidence
  - Persuasiveness and clarity
  - Addressing opponent's arguments
  - Staying on topic
  - Originality of ideas

## Architecture

- `/api/debate`: Edge function that orchestrates AI responses with streaming
- `/api/analyze`: Structured output generation for debate scoring
- Client-side state management for real-time message display
- TypeScript types for type-safe debate flow

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/debateai-arena)

Make sure to add your environment variables in Vercel project settings.

## License

MIT License - Built for TreeHacks 2026
