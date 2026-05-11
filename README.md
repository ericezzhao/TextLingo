# TextLingo

TextLingo is a visual AI learning web app built with Next.js. A learner enters a topic, optionally uploads source material, and receives a structured course with sections, lesson nodes, page-based lessons, quizzes, notes, section reviews, and progress tracking.

Most learners are expected to use the hosted web app rather than running the project locally.

## What is implemented

- Topic-based AI course generation
- Optional source-material upload for TXT, PDF, and DOCX
- Uploaded source material is treated as the primary authority for generation
- Large source uploads use Supabase Storage before server-side text extraction
- Section-based course roadmap with locked future lessons
- Lesson gating: learners can only open completed lessons or the next incomplete lesson
- Multi-page lesson viewer with fixed top navigation and bottom controls
- Large centered intro page for each lesson
- End-of-lesson review quiz required before completing a lesson
- Randomized quiz answer order
- Section review quizzes after each section
- Section reviews are completed once and then marked complete
- AI-powered “Check My Understanding” tutor per lesson page
- Lesson-specific notes panel with localStorage persistence
- App-rendered educational diagram templates instead of raw model SVG rendering
- Generated course thumbnail/notebook images based on course topic
- Supabase-backed course and progress persistence
- Course library with rename/delete actions
- Demo fallback when no OpenAI API key is configured

## Tech stack

- Next.js 15
- React 19
- Tailwind CSS
- Supabase for server-side persistence
- OpenAI-compatible chat completion API for course generation and tutoring

## Replication package

This repository serves as the replication package for TextLingo. It contains the source code, database schema, configuration examples, and instructions needed to reproduce the application environment.

### Package contents

- `app/` — Next.js App Router pages and API routes
- `components/` — UI components for the shell, course library, roadmap, lesson viewer, section review, and generated course thumbnails
- `lib/` — course generation, Supabase persistence, learner session handling, utilities, and shared types
- `supabase/schema.sql` — SQL schema for the required Supabase tables
- `.env.example` — environment variable template
- `package.json` — dependency and script definitions
- `tailwind.config.ts` and `app/globals.css` — styling/theme configuration

### Environment variables

Create a local `.env.local` file from `.env.example` and fill in the required values:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_TUTOR_MODEL=gpt-5.4-mini
```

The app also supports these Supabase key aliases if needed:

```bash
SUPABASE_SECRET_KEY=your_supabase_service_role_key
SUPABASE_SECRET_KEYS=your_supabase_service_role_key
```

If `OPENAI_API_KEY` is blank, TextLingo falls back to the built-in demo course generator. AI course generation and AI tutoring require `OPENAI_API_KEY`.

Do not commit `.env.local` or real secrets.

### Database setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run the SQL in:

```bash
supabase/schema.sql
```

This creates the required tables:

- `textlingo_learners`
- `textlingo_courses`

Large uploaded source files are stored temporarily in a private Supabase Storage bucket named:

- `textlingo-source-uploads`

The app attempts to create this bucket automatically using the server-side Supabase key. If automatic bucket creation is blocked in your Supabase project, create the bucket manually as a private bucket with a file size limit of at least 25 MB.

TextLingo uses an anonymous browser-scoped learner cookie for this MVP, so no user authentication setup is required for replication.

### Reproduce locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### Type check

```bash
npx tsc --noEmit --pretty false
```

## Persistence model

- TextLingo creates an anonymous learner cookie in the browser.
- Courses and progress are stored in Supabase for that learner.
- Completed lesson IDs are stored on the course record.
- Section review completion is stored separately from lesson progress, so it does not inflate the lesson count.
- Lesson notes currently persist in browser localStorage only.

## Important notes

- Uploaded files are processed on the server and trimmed before generation.
- Raw model-generated SVGs are not rendered directly; the app uses controlled diagram templates.
- Existing generated courses may not use all newer visual templates unless regenerated.
- For production-hardening, the next step would be proper user authentication plus row-level access policies tied to authenticated users.
