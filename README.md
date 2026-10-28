# Resume2Hire AI

**Autonomous Career & AI Talent Match Platform** — upload a resume, get an ATS score, see matching jobs, improve your bullets and track applications, with a human approval gate before anything is submitted.

**Live demo:** https://resume2hire-ai.vercel.app/

---

## Features

- **Resume analysis** — PDF / DOCX / TXT upload (≤ 10 MB) or paste text; text extraction with pdf.js and mammoth; skill detection, ATS score, score breakdown (impact, brevity, style, skills coverage), strengths, gaps and prioritised suggestions
- **Job recommendations** — live remote jobs feed with Firestore and sample-data fallbacks; explainable match score (matched vs. missing skills); filters; saved jobs; job details
- **AI resume improvement** — before / after bullet diffs with accept, reject and edit
- **Application tracker** — submitted → under review → interviewing → offer → archived
- **Career agent** — floating chat assistant with 14 actions (analyze resume, find jobs, prepare apply, apply, withdraw, compare resume with job, prepare interview, and more)
- **Human approval gate** — apply / withdraw / reset always ask for confirmation first
- **AI agent activity log**, notifications, profile & settings
- **Optional n8n webhook** for AI analysis, with automatic local fallback

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, React Router 7 |
| Styling | Tailwind CSS ("Executive Precision" design system) |
| Parsing | pdfjs-dist, mammoth |
| Backend services | Firebase Auth, Cloud Firestore, Cloud Storage, Analytics |
| AI workflow | Optional n8n webhook |
| Hosting | Vercel (SPA rewrite via `vercel.json`) |

## Project Structure

```
Resume2Hire-AI-main/
├── src/
│   ├── pages/        Home, Login, SignUp, Dashboard, ResumeAnalysis, JobRecommendations,
│   │                 JobDetails, AiResumeImprovement, ApplicationTracker, AiAgentActivity, Profile
│   ├── components/   layout, common UI, FloatingCareerAgent
│   ├── context/      Auth, Resume, Notification, Agent providers
│   ├── services/     documentParser, resumeService, jobService, agentPlanner, agentTools,
│   │                 n8nBoundary, firebase*Service, mockData
│   ├── firebase/     config.ts, schema.ts
│   └── types/
├── firestore.rules   Firestore security rules
├── storage.rules     Storage security rules
├── firebase.json     Rules + local emulators
├── vercel.json       SPA rewrites
└── .env.example      Environment variable template
```

## Quick Start

**Requirements:** Node.js 18+ and npm.

```bash
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173.

> No Firebase yet? Leave the Firebase values empty or set `VITE_USE_MOCK_FALLBACK="true"` — the app runs in mock mode.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics ID (optional) |
| `VITE_USE_MOCK_FALLBACK` | `true` forces mock mode |
| `VITE_N8N_WEBHOOK_URL` | n8n webhook base URL (optional) |

## Firebase Setup

1. Create a Firebase project and add a Web app; copy its config into `.env`.
2. Enable **Authentication → Email/Password**, **Firestore** and **Storage**.
3. Deploy the rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules,storage
   ```
4. Add your deployed domain under Authentication → Settings → Authorized domains.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |

## Deploy to Vercel

Import the repository, choose the **Vite** preset (build `npm run build`, output `dist`), add the environment variables, and deploy.

## n8n Integration (optional)

The app sends a multipart `POST` to `${VITE_N8N_WEBHOOK_URL}/workflow/resume-extract` with `file`, `data`, `userId`, `resumeId`, `targetRole` and `resumeText`, and expects:

```json
{ "analysis": { "score": 0, "skills": [], "education": [], "experience": [],
                "strengths": [], "missingSkills": [], "suggestions": [], "breakdown": {} } }
```

If the webhook fails, the built-in local analyser is used automatically. Change the path in `src/services/apiConfig.ts` if yours differs.

## Security

- Firestore: deny by default; owner-only access to user data; `jobs` read-only for clients
- Storage: `resumes/{userId}/…`, owner only, ≤ 10 MB, PDF / DOC / DOCX / TXT only
- Nothing is applied or deleted without explicit user confirmation

## Documentation

BRD, presentation, architecture diagram, installation guide, feature list, business use case and roadmap are provided alongside this repository.

## License

Add your preferred license here.
