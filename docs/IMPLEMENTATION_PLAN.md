# TendAI / TendSOS — Frontend Implementation Plan

> Source: *TENDAI_HACKATHON_SLIDES* (14 slides, 25 Nov 2026) plus the product brief from the team.
> Tagline: **TendSOS responds. TendAI stays with you.**

## 1. What we are building

A responsive React **web app** (works on desktop and phone browsers; installable PWA later) with two parts:

| Part | Purpose |
|---|---|
| **Landing page** | Explains TendSOS + TendAI to judges, families and care providers. Ends with a "Try the demo" call to action. |
| **The web app** | Onboarding → permissions → home of icon tiles with a big red SOS button at the top. Navigation is a left rail on desktop and a bottom bar on phones, with the AI agent (TendTalk) as the centre action. |

The backend (Python + FastAPI, Qdrant, Vapi + Twilio) is built separately. The frontend talks to it through a small API layer and runs on **mock data** until those endpoints exist.

## 2. Design system

**Colour: Nigerian health palette.** Nigeria's national green and white are used across public health bodies (FMoH, NCDC, NHIA). Red is kept only for emergencies.

| Token | Hex | Use |
|---|---|---|
| `--green-700` | `#006B3F` | Headings, active nav, primary buttons (hover) |
| `--green-600` | `#008751` | **Primary**: Nigerian flag green |
| `--green-50` | `#E8F5EE` | Tile backgrounds, soft surfaces |
| `--white` | `#FFFFFF` | Base surface (flag white) |
| `--red-600` | `#D62828` | **SOS only**: emergency button, countdown, critical alerts |
| `--amber-500` | `#E9A23B` | "In progress" statuses (calling, text sent) |
| `--ink-900` | `#0F1F17` | Body text |

Rules: red is never used for decoration, only for SOS and danger. Every status uses an icon and words as well as colour (accessibility). Tap targets are at least 48 px. Font: *Plus Jakarta Sans*.

## 3. Information architecture

```
/                      Landing page
/app
  ├─ onboarding/       1 Name · 2 Age · 3 Height & weight · 4 Sex (optional)
  ├─ permissions/      Location (required for SOS), Notifications, Contacts (optional)
  ├─ home              SOS button + tile grid + bottom nav
  │   ├─ circle        Emergency contacts (TendCircle): name, phone, relationship
  │   ├─ medical       Emergency info: blood group, genotype, allergies, known infections, conditions, meds
  │   ├─ verify        Verify medicine: NAFDAC registration number check (TendVerify)
  ├─ diet          Daily meals dialog → AI recommendations (fruit, supplements, meal timing)
  │   ├─ fit           Fit Health: steps, calories, water, sleep, weight/BMI
  │   ├─ locator       Help Locator: map + nearby hospitals + detail sheet (call / directions) + add own
  │   └─ cpr           CPR guide (assets coming from the team)
  ├─ agent             TendTalk chat (bottom-nav centre button)
  └─ sos               Countdown (default 5 s, configurable) → incident status screen
```

## 4. Key flows

### 4.1 Onboarding (about 60 s)
One question per screen with a progress bar. Data is saved to local state now (`localStorage`) and synced to `POST /profile` later. "Skip" is allowed for everything except name.

### 4.2 Permissions
Explain *why* before calling `navigator.geolocation`. If the user declines, SOS still works and asks for location again when pressed.

### 4.3 SOS pipeline (UI side)
1. User taps the red **SOS** button, and a full-screen countdown starts (default **5 s**, set in Settings: 3, 5, 10 s). A large **Cancel** button is shown.
2. When it reaches 0: `POST /incidents` with location plus the allowed profile fields. The backend starts the agent team (find care, call hospital, call/text contacts, alert helpers).
3. The status screen subscribes to incident updates (SSE or polling `GET /incidents/:id`) and shows one row per contact with an honest status: *Calling now · Answered · Text sent · Failed · Demo alert only*.
4. It always shows a "Call 112 directly" button, and a "Share medical ID" card for responders.

> Slide 06 says: "No automatic 'help is coming' claim." The brief asks for a "Help is on the way" screen. The mockup uses that headline, but the rows underneath only show confirmed statuses. **The team should agree the final wording.**

### 4.4 Diet assistant
Bottom-sheet dialog: breakfast / lunch / dinner / snacks (free text plus quick chips such as *eba, rice, beans, yam, plantain, bread*). `POST /diet/analyse` returns fruit and food suggestions, how often to eat, and a disclaimer. AI explains; it does not diagnose (slide 07).

### 4.5 Help Locator
Map: **Leaflet + OpenStreetMap tiles** (matches slide 05). Facilities come from `GET /facilities?lat&lng` (backed by Qdrant). The detail sheet has the name, type, distance, hours, phone, **Call**, **Directions** (opens Google Maps or OSM), and **Add to my SOS list**. Users can add their own hospital or trusted person, and these are included in the SOS call list.

## 5. Tech stack (frontend)

| Concern | Choice |
|---|---|
| Build | Vite 8 + React 19 (already scaffolded) |
| Routing | `react-router` (mockup uses a tiny in-app router to stay dependency-free) |
| State | React context + `localStorage`; TanStack Query once the API is live |
| Map | `leaflet` + `react-leaflet` |
| Icons | Inline SVG set (`src/components/Icon.jsx`); swap for `lucide-react` if preferred |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`) |
| PWA | `vite-plugin-pwa` (offline shell + install prompt) |

## 6. API contract (proposed, to agree with the backend team)

```
POST /auth/otp                { phone, mode: signup|signin } -> 200 sent | 404 no account (signin) | 409 exists (signup)
POST /auth/verify             { phone, code } -> { token, me }
POST /profile                 { name, age, heightCm, weightKg, sex? }
PUT  /profile/medical         { bloodGroup, genotype, allergies[], infections[], conditions[], medications[] }
GET  /contacts  POST /contacts  DELETE /contacts/:id   { name, phone, relationship, notifyBy: [call|sms|whatsapp] }
GET  /facilities?lat&lng&radius
POST /facilities/custom       { name, phone, address, lat?, lng? }
POST /incidents               { lat, lng, shareFields[] }  -> { id }
GET  /incidents/:id/stream    SSE: { target, channel, status, at }
POST /incidents/:id/cancel
POST /diet/analyse            { meals: {breakfast, lunch, dinner, snacks} } -> { recommendations[], frequency, note }
POST /agent/chat              { messages[] } -> streamed reply
POST /reports/extract         multipart file (photo/PDF) -> OCR -> { fileName, date, lab, results[] } (user checks before saving)
POST /reports                 { date, lab, fileName, results: [{ key, test, value, unit, refLow, refHigh }] }
GET  /reports   DELETE /reports/:id
GET  /reports/insights        -> { items: [{ key, test, status, value, previous, changePct, summary, meaning, questions[] }], note }
GET  /medicines/verify?nafdac=A4-1234
                              -> { nafdacNo, status: registered|expired|suspended|not_found,
                                   name, activeIngredients[], form, category, holder, manufacturer,
                                   approvedOn, expiresOn, alert?, checkedAt, source }
```

**Verify medicine (TendVerify):** the backend looks up the number in NAFDAC's registration records (e.g. the NAFDAC Greenbook) and caches results. The screen always says that a registered number does not prove a pack is genuine (slide 14).

## 7. Build order (hackathon timeline)

| # | Milestone | Done when |
|---|---|---|
| 0 | **Mockup** (this commit) | Landing + clickable web-app prototype of every screen, with mock data |
| 1 | Design tokens + component kit | Button, Tile, Sheet, Field, StatusRow, Countdown |
| 2 | Onboarding + permissions | Profile saved; geolocation granted or handled |
| 3 | **SOS flow** (demo priority #1) | Countdown → `POST /incidents` → live status timeline |
| 4 | Circle + Medical ID | CRUD against API; medical card shown on the SOS screen |
| 5 | Help Locator | Real Leaflet map of Abeokuta, facility sheet, call and directions |
| 6 | TendTalk agent | Streaming chat from the bottom nav |
| 7 | Diet + Fit Health | Diet dialog → recommendations; fitness tiles |
| 8 | CPR guide | Team's images; step-by-step with a metronome (100–120 bpm) |
| 9 | Polish | PWA, empty and error states, demo labels, accessibility pass |

## 8. Honesty and safety labels (from the slides)

- Every simulated call or helper alert is labelled **Demo**.
- "Calling" is not "answered"; "text sent" is not "help confirmed".
- AI pages carry this note: *AI can explain and organise. Qualified professionals make clinical decisions.*
- A direct emergency-call option (112) is always visible during SOS.

## 9. Open questions

1. Final wording for the post-countdown screen ("Help is on the way" vs. status-only).
2. CPR images and guide content (coming from the team).
3. Which profile fields are shared with hospitals by default.
4. Does Fit Health read from a device (Google Fit / Health Connect) or use manual entry for the demo?
