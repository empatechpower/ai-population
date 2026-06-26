# AI Pregnancy Optimization App

React (Next.js 14) frontend calling Bubble's external APIs directly.
No server-side proxy. No API routes. All calls go browser → Bubble.

## Architecture

```
Browser (React)
    │
    ├── Bubble Data API      GET/POST/PATCH /api/1.1/obj/<type>
    │   lib/bubble.ts        Read & write all database records
    │   lib/data.ts          Typed helpers per data type
    │
    ├── Bubble Workflow API  POST /api/1.1/wf/<workflow-name>
    │   lib/workflows.ts     Trigger backend AI workflows
    │
    └── Bubble Auth API      POST /api/1.1/wf/login|signup
        lib/auth.ts          Session token stored in cookies

Bubble Backend (server-side, in Bubble)
    ├── OpenAI API key       Stored securely in Bubble — never in browser
    ├── process_protocol     Calls OpenAI → saves Protocol record
    ├── process_score        Calls OpenAI → saves fertility_score
    ├── generate_nutrition   Calls OpenAI → saves Meal records
    ├── onboarding_complete  Chains all three above
    └── daily_refresh        Scheduled: runs for all users at 5 AM
```

## Why this approach

- OpenAI key lives in Bubble — never exposed to the browser
- No Next.js API routes to maintain or deploy
- Bubble handles auth, database, and AI orchestration
- React handles only UI and state
- Deploy to Vercel as a static site (just `next export`)

## Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Bubble (database + auth + backend workflows + OpenAI)
- **State**: Zustand
- **HTTP**: Native `fetch` — no axios needed
- **Hosting**: Vercel

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in only two values:
- `NEXT_PUBLIC_BUBBLE_BASE_URL` — e.g. `https://my-app.bubbleapps.io/api/1.1`
- `NEXT_PUBLIC_BUBBLE_API_TOKEN` — from Bubble Settings → API → Generate token

### 3. Bubble configuration required

**Settings → API tab:**
```
✅ Enable Data API
✅ Enable Workflow API and backend workflows

Expose these data types:
  ✅ User
  ✅ Protocol
  ✅ Meal
  ✅ Post
  ✅ Comment
  ✅ Message
  ✅ JourneyModule
```

**Backend workflows to create (with "Expose as public API" ON):**
```
process_protocol      param: calling_user (User)
process_score         param: calling_user (User)
generate_nutrition    param: calling_user (User)
onboarding_complete   param: calling_user (User)
recalibrate           param: calling_user (User)
like_post             param: post_id (text)
save_protocol         param: user_id, nutrition_plan, supplements,
                             movement, avoid_today, fertility_tip
```

**Store your OpenAI key in Bubble:**
```
Settings → API keys → Add key: OPENAI_API_KEY
Reference it in your backend workflow API calls
```

### 4. Run development
```bash
npm run dev
```

### 5. Deploy
```bash
# Vercel — just push to GitHub and connect
vercel --prod
```

## Pages

| Route | Description |
|---|---|
| `/` | Landing + auth |
| `/onboarding` | 5-step onboarding |
| `/dashboard` | Home: score + protocol |
| `/nutrition` | Meal plan |
| `/movement` | Exercise list |
| `/movement/[id]` | Exercise detail |
| `/journey` | Way to Baby / Baby tabs |
| `/journey/protocol` | Protocol modules |
| `/journey/protocol/[id]` | Module detail |
| `/journey/pregnancy` | Trimester protocol |
| `/journey/recovery` | Postpartum recovery |
| `/community` | Feed + composer |
| `/community/[id]` | Post + comments |
| `/community/chat/[id]` | DM thread |

## Data flow — protocol generation

```
1. Dashboard loads
2. useProtocol() calls getTodayProtocol() → Bubble Data API
3. If none found → triggerGenerateProtocol() → Bubble Workflow API
4. Bubble backend workflow calls OpenAI → saves Protocol record
5. useProtocol() polls getTodayProtocol() every 3s
6. Protocol appears → state updates → UI renders
```
