# Gym Bro App

Production architecture repository for Gym Bro App, structured into a dedicated frontend mobile app (Expo / React Native) and backend API service (Node.js / Express).

---

## 📁 Repository Structure

```
gymbroapp/
├── frontend/             # Mobile client (Expo / React Native v57)
│   ├── src/              # Application source code (Expo Router, store, UI, models)
│   │   ├── app/          # File-based routes (tabs, workouts, onboarding, settings)
│   │   ├── api/          # Supabase & backend API clients
│   │   ├── components/   # Reusable UI components
│   │   ├── data/         # Prebuilt routines & exercises
│   │   ├── models/       # TypeScript interfaces & models
│   │   ├── store/        # Zustand state stores (routine, auth, theme, settings)
│   │   ├── styles/       # Global theme & layout styles
│   │   └── utils/        # Date, async, & PR tracking utilities
│   ├── assets/           # App icons, splash screens, and images
│   ├── app.json          # Expo configuration
│   ├── eas.json          # Expo Application Services build profiles
│   ├── tsconfig.json     # TypeScript configuration with @/* path aliases
│   └── package.json      # Mobile dependencies & scripts
│
├── backend/              # REST API & Database server (Node.js / Express / TypeScript)
│   ├── src/              # Express server source code
│   │   ├── db/           # PostgreSQL connection pool
│   │   ├── middleware/   # Authentication & rate limiting middleware
│   │   ├── models/       # Backend data models
│   │   └── routes/       # Auth, users, workouts, routines, exercises routes
│   ├── tsconfig.json     # TypeScript configuration
│   ├── .env.example      # Environment variables template
│   └── package.json      # Backend dependencies & scripts
│
├── database/             # Database schemas, migrations, & seed files
│   ├── seed_exercises.sql
│   ├── supabase_security_hardening.sql
│   └── swagger.json
│
├── docs/                 # Documentation (Privacy Policy, Terms of Service)
├── scripts/              # Utility & maintenance scripts
├── package.json          # Monorepo root orchestration scripts
└── .gitignore
```

---

## 🚀 Quick Start

### Root Scripts (Run from repository root)

- **Start Mobile App**:
  ```bash
  npm run frontend
  # or
  npm start
  ```
- **Start Backend Server**:
  ```bash
  npm run backend
  ```
- **Run Type Checks (Both Frontend & Backend)**:
  ```bash
  npm run typecheck
  ```
- **Build Backend**:
  ```bash
  npm run build:backend
  ```

---

### Running Frontend Separately

```bash
cd frontend
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run typecheck      # Typecheck TypeScript files
```

### Running Backend Separately

```bash
cd backend
npm run dev            # Start Express server with tsx watch
npm run build          # Compile TypeScript to dist/
npm start              # Run compiled production server
```
