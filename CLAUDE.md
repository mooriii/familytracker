# FamilyTracker — Project Guide for Claude

## What This App Does
A mobile app that allows parents to see the real-time location of their children via their smartphones.
No hardware required — the child installs the app and shares their location in the background.

## Platform
- iOS + Android (via React Native + Expo)
- Backend hosted on a cloud server (Node.js)

---

## Architecture Overview

```
Child's Phone
  └── Expo app (background location)
        ↓ HTTP POST / WebSocket
Backend API (Node.js + Express)
  └── PostgreSQL (stores users, families, locations)
        ↓ WebSocket push
Parent's Phone
  └── Expo app (map view, geofence alerts)
```

---

## Tech Stack

| Layer        | Technology              | Notes                                  |
|--------------|-------------------------|----------------------------------------|
| Mobile       | React Native + Expo     | Managed workflow, EAS Build for deploy |
| Navigation   | Expo Router             | File-based routing                     |
| State        | Zustand                 | Lightweight global state               |
| Maps         | react-native-maps       | Google Maps on Android, Apple on iOS   |
| Location     | expo-location           | Background location tracking           |
| Push Notifs  | expo-notifications      | Geofence alerts                        |
| Backend      | Node.js + Express       | REST API + WebSocket server            |
| Real-time    | Socket.io               | Push location from child to parent     |
| Database     | PostgreSQL              | Users, families, location history      |
| ORM          | Prisma                  | Type-safe DB queries                   |
| Auth         | JWT + bcrypt            | Family accounts, invite codes          |
| Hosting      | Railway or Render       | Free tier to start                     |

---

## Folder Structure

```
family-tracker/
├── CLAUDE.md               ← this file
├── skills.md               ← step-by-step build plan
├── apps/
│   └── mobile/             ← Expo React Native app
│       ├── app/            ← Expo Router screens
│       │   ├── (auth)/     ← login / register screens
│       │   ├── (parent)/   ← parent map view, settings
│       │   └── (child)/    ← child sharing screen
│       ├── components/
│       ├── hooks/
│       ├── store/          ← Zustand stores
│       └── services/       ← API calls, socket client
└── apps/
    └── backend/            ← Node.js API
        ├── src/
        │   ├── routes/     ← auth, family, location
        │   ├── sockets/    ← socket.io handlers
        │   ├── middleware/  ← JWT auth guard
        │   └── prisma/     ← schema + migrations
        └── .env.example
```

---

## Key Domain Concepts

| Term        | Meaning                                                    |
|-------------|------------------------------------------------------------|
| Family      | A group account — one parent, one or more children        |
| Member      | A user belonging to a family (role: parent or child)      |
| Tracker     | The location-sharing session on a child's device          |
| Geofence    | A named circular zone — triggers alert if child leaves it |
| Location    | A lat/lng + timestamp + battery % sent by child's device  |

---

## Environment Variables (backend)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/familytracker
JWT_SECRET=change_me
PORT=3000
```

---

## Coding Conventions
- TypeScript everywhere (strict mode)
- Prettier + ESLint enforced
- No `any` types
- API responses always shaped as `{ data, error }``
- All timestamps stored as UTC ISO strings
- Location updates sent every 15 seconds when app is active, 60s in background

---

## Security Rules
- Parents can only see members of their own family
- Children cannot see other children's locations
- Location data older than 30 days is auto-deleted
- JWT tokens expire in 7 days; refresh tokens in 30 days
- All API endpoints require authentication except `/auth/login` and `/auth/register`
