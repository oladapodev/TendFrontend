# TendAI / TendSOS: Go-Live Checklist

What has to happen to turn the mockup on `staging` (commit `ec774a0`) into a live product.
Read with [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

**Priority:** **P0** = needed for a live hackathon demo · **P1** = needed before real users · **P2** = needed before scale.
**Owner:** FE = frontend · BE = backend · OPS = infra/DevOps · PM = product/legal/partnerships.

---

## 1. What is still fake in the mockup

| Area | Today (mock) | Where |
|---|---|---|
| All user data | `localStorage` via `src/app/store.jsx` | store.jsx |
| SOS incident | Timed `setTimeout` script, no real calls/SMS | `src/app/Sos.jsx` |
| Hospitals | 5 hard-coded Abeokuta entries, **fake phone numbers** (`+234 800 000 100x`) | store.jsx `facilities` |
| Map | Hand-drawn SVG, fixed "you are here" | `src/app/Locator.jsx` |
| TendTalk agent | Keyword-matched canned replies | `src/app/Agent.jsx` |
| Diet AI | Keyword rules in the browser | `Screens.jsx` `analyseMeals` |
| Fit Health | Static numbers | store.jsx `fit` |
| Location | Asked for, but never used for the map or SOS | Onboarding.jsx |
| Auth | None. Anyone with the URL is "the user" | — |
| Settings → sharing toggles | Not saved | Screens.jsx `Settings` |
| CPR | Placeholder image, timer button does nothing | Screens.jsx `Cpr` |

---

## 2. Frontend (FE)

### P0 
- [ ] Replace the hash router with `react-router` and real URLs (`/app/locator`, …). Add an SPA fallback on the host.
- [ ] Add an API client layer (`src/api/`) with env-based base URL (`VITE_API_URL`); swap `store.jsx` reads/writes for API calls (TanStack Query).
- [ ] Sign-in screen (phone number + OTP is the best fit for Nigeria), session handling and logout.
- [ ] **SOS:** on countdown end, call `POST /incidents` with live `navigator.geolocation` coordinates; subscribe to `GET /incidents/:id/stream` (SSE) and render real statuses; wire **Cancel** and **I'm safe** to `POST /incidents/:id/cancel`.
- [ ] SOS fallback if the API or network fails: show the error clearly and keep **Call 112** as the primary button.
- [ ] **Help Locator:** install `leaflet` + `react-leaflet`, OpenStreetMap tiles with attribution, real user position, facilities from `GET /facilities?lat&lng`.
- [ ] TendTalk: stream replies from `POST /agent/chat`.
- [ ] Diet: call `POST /diet/analyse` instead of local rules.
- [ ] Persist Settings (countdown, sharing choices) to the profile.
- [ ] Loading, empty and error states for every screen.
- [ ] Remove "Demo" tags only where the feature is truly live; keep them on anything simulated.

### P1 Victor
- [ ] Final post-countdown wording agreed ("Help is on the way" vs status-only, see slide 06).
- [ ] CPR guide: team's images, a 100–120 bpm metronome on "Start compression timer", clinician sign-off.
- [ ] PWA with `vite-plugin-pwa`: install prompt, offline shell, cached Medical ID and Call 112 so they open with no network.
- [ ] Accessibility pass: keyboard, screen reader labels, colour contrast (WCAG AA), focus trap in modals and the SOS overlay.
- [ ] Self-host the Plus Jakarta Sans font (drop the Google Fonts call: faster on slow networks, no third-party request).
- [ ] Fix `oxlint` (native binary fails to load on Windows; reinstall or pin a version) and add it to CI.
- [ ] Unit tests (Vitest + Testing Library) for onboarding, contacts and the SOS state machine; one Playwright end-to-end test for the SOS flow.
- [ ] Code-split the app from the landing page (`React.lazy`) to cut first-load size.
- [ ] Remove unused scaffold files (`src/App.css`, `src/assets/*`, `public/icons.svg`).

### P2 Grace
- [ ] Fit Health from Google Health Connect / Apple Health (needs a native wrapper, e.g. Capacitor).
- [ ] Yoruba, Hausa and Igbo translations (i18n).
- [ ] Push notifications for incident updates and care reminders.
- [ ] Travel Safe check-in, care reminders, report explanation (slides 07–08).

---

## 3. Backend (BE): Python + FastAPI

### P0
- [ ] FastAPI service with the endpoints in IMPLEMENTATION_PLAN.md §6.
- [ ] Database (Postgres suggested): users, profiles, medical info, contacts, custom places, incidents, incident events.
- [ ] Auth: phone OTP (via Twilio Verify or a Nigerian SMS provider), JWT sessions, per-user data access checks.
- [ ] Task queue (e.g. Celery/RQ + Redis, or Arq) to run the SOS agent jobs in parallel with retries.
- [ ] **Incident state machine:** queued → calling → answered/no-answer/failed → retry → done; every change written as an event and pushed over SSE.
- [ ] Only send the fields the user allowed in their sharing settings.
- [ ] Facility search: load the 100,000+ facility records into Qdrant; geo filter + ranking; return a verified phone number where one exists.

### P1
- [ ] Rate limits and abuse protection on `POST /incidents` (accidental and prank SOS).
- [ ] Idempotency on incident creation (double taps, network retries).
- [ ] Audit log of who was contacted, when, and what was shared.
- [ ] LLM provider and prompts for TendTalk + Diet, with safety rules (no diagnosis, always points to SOS/112 for emergencies), logging and red-team tests.

---

## 4. Integrations (BE + PM)

- [ ] **Twilio** (P0): account, a number that can call Nigerian mobiles, **SMS sender ID registered** for Nigeria, and NCC DND rules understood (some lines block promotional SMS; emergency/transactional routing must be confirmed).
- [ ] **Vapi** (P0): voice agent script for the hospital call (who, where, what's wrong, call-back number), recording consent message, fallback to a plain Twilio call.
- [ ] **WhatsApp** (P1): Meta Business verification and approved message templates.
- [ ] Test every call and SMS with **consenting participants only**, as the slides say.
- [ ] **Hospital data** (P0 for Abeokuta): confirm real phone numbers for FMC Abeokuta, Sacred Heart and the others; replace all fake numbers.
- [ ] **Facility response agreements** (P1/P2): at least one hospital agrees to receive TendSOS calls.
- [ ] **Nearby helper network** (P2): enrolment, consent and vetting before any real alerts go out.

---

## 5. Infrastructure and deployment (OPS)

### P0
- [ ] Domain name and HTTPS (geolocation and service workers only work over HTTPS).
- [ ] Frontend hosting: static build (`npm run build` → `dist/`) on Nobus Cloud, or Vercel/Netlify/Cloudflare Pages for the demo, with SPA fallback to `index.html`.
- [ ] Backend hosting on Nobus Cloud (container), plus managed Postgres, Redis and Qdrant.
- [ ] Environment config: `VITE_API_URL` for the frontend; Twilio/Vapi/LLM keys only on the backend, in a secrets manager, never in the repo.
- [ ] CI (GitHub Actions): install, lint, test and build on every PR; deploy `staging` branch → staging site, `main` → production.
- [ ] Separate staging and production environments, keys and databases.

### P1
- [ ] Error tracking (Sentry) for frontend and backend.
- [ ] Uptime monitoring and alerts. **SOS endpoints get paged alerts, 24/7.**
- [ ] Daily encrypted database backups with a tested restore.
- [ ] Load test SOS: many incidents at once, provider slowdowns, retries.
- [ ] Branch protection on `main` (PR + review + passing CI).

---

## 6. Legal, privacy and safety (PM)

- [ ] **Nigeria Data Protection Act 2023 (NDPA):** health data is sensitive personal data. Explicit consent, privacy notice, data-protection officer/contact, and registration with the NDPC if thresholds apply.
- [ ] Privacy policy and terms of use pages (linked from the landing page and onboarding).
- [ ] Consent screens: recording calls, sharing location and medical data with hospitals and contacts, contacting people in the user's circle.
- [ ] Data retention and deletion: a user can export and delete their data.
- [ ] Encryption at rest for medical data; access logging.
- [ ] Clinical review of the CPR guide, TendTalk safety rules and diet advice.
- [ ] Clear disclaimer everywhere: TendSOS **does not replace 112**; listings are not live hospital capacity.
- [ ] Check whether NCC rules or emergency-service partnerships are needed for automated calls to hospitals.

---

## 7. Launch steps

1. [ ] Staging fully wired to real backend + test providers; team runs 10+ end-to-end SOS drills with consenting people.
2. [ ] Fix everything found; confirm every status on screen matches what really happened.
3. [ ] Validation pilot in Abeokuta: consenting families + one care provider + clinical/privacy reviewers (slide 11).
4. [ ] Collect answers to: did the right people get reached, was the update clear, was only useful information shared?
5. [ ] Merge `staging` → `main`, deploy production, monitor closely for the first week.

---

## Minimum for a *live hackathon demo* (if time is short)

1. Deploy the current frontend to an HTTPS URL.
2. FastAPI with `POST /incidents` + SSE stream, running real Twilio SMS and one Vapi call to **team members' own phones**.
3. Real geolocation sent with the incident.
4. Leaflet map with the 3 Abeokuta hospitals from the slides (with checked phone numbers, or clearly marked "demo").
5. Everything else stays mocked and labelled **Demo**.
