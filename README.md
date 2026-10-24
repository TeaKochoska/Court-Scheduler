# BookCourt

A small web app for booking a handball hall. The hall manager publishes free time slots, and clubs or groups of friends book one for a training, a match or a casual game. A booked slot disappears for everyone else, so the hall can never be double booked.

- **Live app:** https://court-scheduler-iota.vercel.app 

## Why this idea

The challenge brief is a generic scheduler. I wanted a concrete user with a real problem: sports clubs and amateur teams who currently arrange hall time through chat groups and phone calls, where trainings and games easily overlap.

So the app is a scheduler with a few handball-specific choices:

- One hall, one slot = the whole hall for one team (keeps "no double bookings" simple and strict).
- Every booking has a **type** (training, match, casual) shown with a colour, and a **player count**.
- The confirmation message is written by an LLM and adapts to the booking type (for example "arrive early to warm up" for a match).

## Features

**Guests (clubs and groups) — `Book` page**
- See all free slots grouped by day
- Filter by date range (from / to)
- Book a slot with club name, type, number of players, contact name and email
- Get a short AI-written confirmation message
- List refreshes automatically, and if someone else takes the slot first the form closes with a clear message

**Host (hall manager) — `Host` page**
- Publish slots (date, start time, duration)
- See every slot, who booked it, the type and the contact details
- Delete a free slot

**Protection against double bookings and overlaps**
- Booking is a single atomic SQL `UPDATE ... WHERE is_booked = false`. If two people click at the same moment, only one update succeeds and the other gets `409 Conflict`.
- The database itself rejects overlapping slots with an `EXCLUDE USING gist` constraint, so the host cannot publish 18:00–19:00 and 18:30–19:30.
- Bookings for slots that already started are rejected.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, React Router |
| Backend | Node.js, Express, TypeScript (run with `tsx`) |
| Database | PostgreSQL (hosted on Neon) |
| AI | Google Gemini API (free tier) via plain `fetch` |

## Project structure

```
scheduler-app/
├── backend/
│   ├── schema.sql              # database schema
│   └── src/
│       ├── index.ts            # Express app
│       ├── db.ts               # PostgreSQL pool
│       ├── routes/slots.ts     # HTTP layer: validation and status codes
│       └── services/
│           ├── slotService.ts  # SQL queries
│           └── aiService.ts    # Gemini call with timeout and fallback
└── frontend/
    └── src/
        ├── api.ts              # all calls to the backend in one place
        ├── types.ts            # shared types and booking labels
        ├── utils.ts            # date formatting and grouping
        ├── components/BookingForm.tsx
        └── pages/              # BookPage.tsx, HostPage.tsx
```


## Running it locally

### 1. Clone

```bash
git clone <repo-url>
cd scheduler-app
```

### 2. Database

Run `backend/schema.sql` once, in the Neon SQL Editor or with:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

### 3. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=4000
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Optional. Without a key the app uses a simple fallback confirmation message.
GEMINI_API_KEY=your_key_from_aistudio.google.com
GEMINI_MODEL=gemini-3.5-flash-lite
```

Then:

```bash
npm run dev
```

The API runs on `http://localhost:4000`. Check `http://localhost:4000/health`.

### 4. Frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:4000
```

Then:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/slots?onlyAvailable=true&dateFrom=&dateTo=` | List slots. All filters are optional. |
| `POST` | `/slots` | Create a slot (`startTime`, `durationMinutes` 15–480). `409` if it overlaps another slot. |
| `POST` | `/slots/:id/book` | Book a slot (`teamName`, `bookingType`, `playersCount`, `contactName`, `contactEmail`). `409` if already booked. Returns the booking plus `confirmationMessage`. |
| `DELETE` | `/slots/:id` | Delete a free slot. `409` if it is booked. |
| `GET` | `/health` | Health check. |

## How I used AI tools

I used **Claude** as an assistant for planning, first drafts of code and explaining concepts I was less sure about.
**Gemini** is used inside the app to write the booking confirmation message, with a timeout and a fallback so a booking never depends on the AI.
I built and adapted the backend routes, service layer, validation rules, and frontend integration myself, while using AI as a helpful coding companion to quickly debug small edge cases and polish the code. Most of my time then went into testing the app and tracking down bugs, for example when the Gemini confirmation kept timing out, I tested different models directly with `curl` until I found a fast one, and added a timeout and a fallback message so a booking never depends on the AI.. I also made the product decisions (the handball hall concept, the booking types, a delete button only for free slots, the date filter,) and set up the database, hosting and deployment myself.

## What I would improve with more time

1. **Host authentication**, so only the manager can publish and delete slots.
2. **Cancel and reschedule bookings**, using a private link sent by email so guests can manage their own booking without accounts.
3. **Send the confirmation by email** (with a calendar `.ics` file), and generate the AI message asynchronously so the booking response is instant.
4. **Recurring slots**, for example every Monday and Wednesday at 18:00 for the next four weeks. This is the most useful feature for clubs.
5. **Multiple halls or courts**, and optionally slots with several teams sharing a hall.
6. **Better UI**: a weekly calendar view, mobile polish, and accessibility checks.
