# TendAI / TendSOS

> **"TendSOS responds. TendAI stays with you."**

TendAI & TendSOS is a dual emergency response system and everyday health companion web application designed specifically for the Nigerian healthcare landscape. It provides rapid, transparent emergency dispatch when urgent care is needed, paired with everyday preventive health tools tailored to local context (Nigerian dietary staples, sickle cell genotype awareness, and regional healthcare directory navigation).

---

## Table of Contents

- [Overview](#overview)
- [What the System Does](#what-the-system-does)
  - [1. Emergency Response (TendSOS)](#1-emergency-response-tendsos)
  - [2. Everyday Health Companion (TendAI)](#2-everyday-health-companion-tendai)
- [How It Works](#how-it-works)
  - [Emergency SOS Workflow](#emergency-sos-workflow)
  - [Information Architecture & Routing](#information-architecture--routing)
  - [State Management & Data Persistence](#state-management--data-persistence)
- [Design System](#design-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
  - [Linting](#linting)
- [Backend & Integration Roadmap](#backend--integration-roadmap)
- [Safety & Privacy Guidelines](#safety--privacy-guidelines)

---

## Overview

In critical health emergencies across Nigeria, patients and families face major hurdles: identifying which nearby facility can accept emergency cases, placing frantic phone calls, and keeping loved ones informed.

**TendAI / TendSOS** addresses both urgent crises and everyday well-being:
1. **TendSOS**: A one-touch emergency pipeline that initiates a timed countdown, contacts your trusted facility or nearest emergency room, alerts your designated personal circle, and notifies verified community helpers with honest, real-time status reporting.
2. **TendAI**: A daily health companion that assists with meal planning based on Nigerian foods, tracks physical activity and hydration, guides adult hands-only CPR, and answers health inquiries in plain language.

---

## What the System Does

### 1. Emergency Response (TendSOS)

- **One-Press SOS Trigger**: Readily accessible from the top navigation bar or the home screen dashboard.
- **Configurable Countdown (Default 5s)**: Features an SVG radial countdown timer (adjustable to 3s, 5s, 10s, or custom duration) allowing users to cancel accidental triggers or bypass directly with "Send now".
- **Transparent Incident Timeline**: Tracks parallel outreach with honest, non-misleading status badges:
  - **Hospital**: Calling now &rarr; Speaking with staff &rarr; Staff confirmed they can help.
  - **TendCircle Contacts**: Calling &rarr; Answered &middot; aware / SMS delivered.
  - **Nearby Helpers**: Community alerts (clearly tagged as Demo in prototype mode).
- **Direct 112 Dialing**: A persistent direct button to call the national emergency line (`112`) is always present on screen.
- **Responder Medical ID Card**: Presents vital clinical details (Blood group, Genotype, Allergies, Known conditions, Medications) directly on the incident screen for first responders.

### 2. Everyday Health Companion (TendAI)

- **TendCircle (Emergency Contacts)**: Manage primary emergency contacts with custom relationships (Parent, Sibling, Spouse, Friend, Doctor) and delivery preference channels (Phone Call, SMS, WhatsApp).
- **Medical ID**: Records blood group, genotype (vital for sickle-cell planning: AA, AS, SS, AC, SC), known allergies, chronic conditions, and responder notes.
- **Help Locator**: Interactive map directory (piloting in Abeokuta, Ogun State, including Federal Medical Centre Abeokuta, Sacred Heart Hospital, and local Primary Health Centres). Users can filter 24h emergency centres, view contact info/directions, and designate a "trusted hospital" to be contacted first during an SOS.
- **TendDiet**: Nutritional guidance tailored for Nigerian diets. Users log meals using quick chips (*Eba, Amala, Pounded yam, Jollof rice, Beans, Moi moi, Akara, Egusi, Garri*). The system analyzes starch portions, recommends leafy greens (*ugwu, ewedu, spinach*) and proteins, and drafts a daily meal timing schedule.
- **Fit Health**: Daily wellness tracking with radial progress gauges for steps, calorie expenditure, water cup intake (with quick `+`/`-` buttons), sleep hours, and BMI calculation.
- **TendTalk AI**: Conversational health agent providing plain-English explanations for first aid (fainting), genotype guidance, hypertension nutrition tips, and doctor visit question preparation.
- **CPR Guide**: Adult hands-only CPR step-by-step instructions (5–6 cm depth, 100–120 bpm rhythm).

---

## How It Works

### Emergency SOS Workflow

```
[User Taps SOS]
       │
       ▼
[Radial Countdown Screen (3-10s)] ──── (User taps Cancel or presses Esc) ───► [Canceled]
       │ (Countdown ends or "Send now")
       ▼
[Live Incident Pipeline]
       ├── Dispatch hospital call (FMC Abeokuta / Preferred hospital)
       ├── Dispatch SMS & voice calls to TendCircle contacts
       ├── Alert opted-in nearby community helpers
       └── Display Responder Medical ID + Direct Call 112 button
```

### Information Architecture & Routing

The application uses a lightweight, hash-based client-side router (`src/router.js`):

```
#/                     Landing Page (Public marketing, problem overview, interactive preview)
#/app                  Main Web Application (Gated by Onboarding & Permissions)
  ├── #/app            Home Dashboard (SOS hero button, tools grid, readiness checklist)
  ├── #/app/circle     TendCircle Emergency Contacts
  ├── #/app/medical    Medical ID (Blood group, genotype, allergies, conditions)
  ├── #/app/locator    Help Locator (Abeokuta facility directory & map)
  ├── #/app/diet       TendDiet (Meal logging & AI nutritional analysis)
  ├── #/app/fit        Fit Health (Steps, calories, water, sleep, BMI)
  ├── #/app/cpr        CPR Guide (Adult hands-only compression instructions)
  ├── #/app/agent      TendTalk AI Chat Companion
  └── #/app/settings   Settings (SOS countdown length, sharing toggles, demo reset)
```

### State Management & Data Persistence

- Application state is coordinated via React Context (`StoreProvider` in `src/app/store.jsx`).
- State is automatically synced to `localStorage` under the key `tendai-demo-v1` so that user profile data, contacts, medical details, and settings persist across page reloads during demos.
- Includes an emergency readiness tracker (`0/5` to `5/5`) on the home screen assessing whether Profile, Location permissions, 2+ Contacts, Medical ID, and a Trusted Hospital have been configured.

---

## Design System

Designed according to the **Nigerian health palette**:
- `--green-600` (`#008751`): National green, representing health, primary actions, and brand identity.
- `--green-700` (`#006B3F`): Active states, headings, and focused navigation.
- `--green-50` (`#E8F5EE`): Soft background surfaces and active chips.
- `--red-600` (`#D62828`): Reserved **strictly** for SOS emergency actions, countdown dials, and critical health alerts (never used decoratively).
- `--amber-500` (`#E9A23B`): In-progress statuses (calling, dispatching text).
- `--ink-900` (`#0F1F17`): High-contrast typography for readability.
- **Typography**: *Plus Jakarta Sans*, with minimum touch targets of 48px for emergency accessibility.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Build & Tooling** | [Vite 8](https://vitejs.dev/) |
| **Frontend Framework** | [React 19](https://react.dev/) |
| **Linter** | [Oxlint](https://oxc.rs/) |
| **Styling** | Vanilla CSS with Design Tokens (`tokens.css`, `app.css`, `landing.css`) |
| **Icons** | Custom accessible inline SVG icons (`src/components/Icon.jsx`) |
| **Routing** | Zero-dependency hash router (`src/router.js`) |
| **State** | React Context + `localStorage` (`src/app/store.jsx`) |

---

## Project Structure

```
TendFrontend/
├── docs/
│   ├── GO_LIVE_CHECKLIST.md      # Roadmap and checklist for staging to production
│   └── IMPLEMENTATION_PLAN.md   # Product specification and technical architecture
├── public/                      # Static assets
├── src/
│   ├── app/                     # Core Web Application
│   │   ├── Agent.jsx            # TendTalk conversational health companion
│   │   ├── app.css              # Main application styling and components
│   │   ├── Locator.jsx          # Help Locator & Abeokuta hospital map
│   │   ├── Onboarding.jsx       # 4-step wizard & permissions gatekeeper
│   │   ├── Screens.jsx          # Home, Circle, Medical ID, Diet, Fit, CPR, Settings
│   │   ├── Sos.jsx              # Emergency SOS countdown & live incident modal
│   │   ├── store.jsx            # React Context, initial state & mock facility data
│   │   └── WebApp.jsx           # App layout shell, desktop rail & mobile bottom nav
│   ├── assets/                  # Images and static logos
│   ├── components/
│   │   └── Icon.jsx             # SVG icon library and TendAI logo
│   ├── landing/                 # Public Landing Page
│   │   ├── Landing.jsx          # Marketing page with live incident preview
│   │   └── landing.css          # Landing page styles and responsive layout
│   ├── App.jsx                  # Root component (routes between Landing and WebApp)
│   ├── index.css                # Base CSS resets and font imports
│   ├── main.jsx                 # Vite application entry point
│   └── router.js                # Hash router implementation (`useRoute`, `go`)
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and npm scripts
└── vite.config.js               # Vite build configuration
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `pnpm`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/TendAI/TendFrontend.git
cd TendFrontend
npm install
# or: pnpm install
```

### Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
# or: pnpm dev
```

Open your browser and navigate to `http://localhost:5173`.

### Production Build

Create an optimized static production build in `dist/`:

```bash
npm run build
# or: pnpm build
```

To preview the production build locally:

```bash
npm run preview
# or: pnpm preview
```

### Linting

Run Oxlint to check code quality:

```bash
npm run lint
# or: pnpm lint
```

---

## Backend & Integration Roadmap

Currently, TendFrontend operates as an interactive prototype using local mock data and simulated incident timelines. The planned backend integration architecture includes:

- **API Service**: Python + FastAPI endpoints for profile, medical record sync, facility queries, and incident creation.
- **Incident State Machine & Streaming**: Server-Sent Events (`GET /incidents/:id/stream`) for real-time incident status propagation.
- **Emergency Telephony**: Twilio (SMS & call routing) + Vapi (automated conversational voice agent to communicate with hospital triage staff).
- **Facility Geo-Search**: Qdrant vector database indexing 100,000+ Nigerian health facilities with verified contact details.
- **Mapping**: Transitioning from custom SVG vector maps to Leaflet + OpenStreetMap tiles.

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) and [docs/GO_LIVE_CHECKLIST.md](docs/GO_LIVE_CHECKLIST.md) for full details.

---

## Safety & Privacy Guidelines

- **Clinical Disclaimer**: AI explanations provided by TendTalk and TendDiet are strictly educational and organizational. Qualified medical professionals make clinical diagnoses and treatment decisions.
- **Emergency Disclaimer**: TendSOS is designed to augment emergency coordination, not replace national emergency response systems. Direct access to `112` is permanently displayed during incidents.
- **Honest Statuses**: Status labels distinguish confirmed communication from in-progress steps (*"Calling now"* vs. *"Staff confirmed"*).
- **Nigeria Data Protection Act (NDPA 2023)**: Health data is treated as sensitive personal data. Users retain granular control over which fields are transmitted during an emergency via Settings.
