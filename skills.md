# FamilyTracker — Build Skills (Step-by-Step Plan)

Each skill is a self-contained phase. Complete them in order.
Mark each skill ✅ when done.

---

## Skill 1 — Project Scaffold ⬜
**Goal:** Set up the monorepo and install all dependencies.

Steps:
1. Initialize monorepo with `npm workspaces` or `pnpm workspaces`
2. Create `apps/mobile` — Expo project with TypeScript template
3. Create `apps/backend` — Node.js + Express + TypeScript project
4. Configure ESLint + Prettier for both apps
5. Configure `tsconfig.json` (strict mode) for both apps
6. Add `.gitignore` and initialize git repo

Deliverable: Both apps start without errors (`expo start` and `npm run dev`)

---

## Skill 2 — Database Schema ⬜
**Goal:** Design and migrate the PostgreSQL database.

Tables:
- `users` — id, name, email, password_hash, role (parent|child), family_id, created_at
- `families` — id, name, invite_code, created_at
- `locations` — id, user_id, lat, lng, accuracy, battery_pct, recorded_at
- `geofences` — id, family_id, name, lat, lng, radius_meters, created_at

Steps:
1. Install and configure Prisma
2. Write `schema.prisma` with all tables
3. Run initial migration
4. Seed script with one test family (parent + child)

Deliverable: `npx prisma studio` shows all tables with seed data

---

## Skill 3 — Backend Auth API ⬜
**Goal:** Register, login, and protected routes.

Endpoints:
- `POST /auth/register` — create parent account + family
- `POST /auth/login` — returns JWT access token + refresh token
- `POST /auth/invite` — parent generates invite code for child
- `POST /auth/join` — child joins family with invite code
- `GET /auth/me` — returns current user profile

Steps:
1. Build Express router for `/auth`
2. Implement bcrypt password hashing
3. Implement JWT sign + verify middleware
4. Write input validation (zod)
5. Write unit tests for auth routes

Deliverable: All auth endpoints tested via Postman/Thunder Client

---

## Skill 4 — Location API + WebSockets ⬜
**Goal:** Child sends location; parent receives it in real-time.

Endpoints:
- `POST /location` — child posts lat/lng (saved to DB)
- `GET /location/:userId/latest` — parent gets last known location
- `GET /location/:userId/history` — returns last 24h of points

WebSocket events:
- `location:update` — child emits; server broadcasts to parent room
- `join:family` — client joins their family room on connect

Steps:
1. Build Express router for `/location`
2. Set up Socket.io server
3. On `POST /location`, also emit `location:update` to family room
4. Write Prisma query to auto-delete locations older than 30 days

Deliverable: Postman WebSocket client receives live location updates

---

## Skill 5 — Mobile App: Auth Screens ⬜
**Goal:** Login, register, and join-family screens.

Screens:
- `/` — splash / role selector (I am a Parent / I am a Child)
- `/auth/register` — parent registration form
- `/auth/login` — login form (both roles)
- `/auth/join` — child enters invite code

Steps:
1. Set up Expo Router with `(auth)` group
2. Build form components with validation (react-hook-form + zod)
3. Connect to backend auth API (axios service)
4. Store JWT in SecureStore (expo-secure-store)
5. Redirect to correct home screen based on role after login

Deliverable: Parent and child can register, login, and land on their home screen

---

## Skill 6 — Child App: Background Location Sharing ⬜
**Goal:** Child's app silently sends location while in background.

Steps:
1. Request foreground + background location permissions (expo-location)
2. Start `Location.startLocationUpdatesAsync` background task
3. Every 15s (active) / 60s (background) POST to `/location` API
4. Show a status screen: "Sharing your location with [Family Name]"
5. Allow child to pause sharing (with confirmation)
6. Show battery % and last sync time on screen

Deliverable: Child's phone sends location; it appears in the DB

---

## Skill 7 — Parent App: Map View ⬜
**Goal:** Parent sees all children on a live map.

Steps:
1. Set up `react-native-maps` with Google Maps API key
2. Connect to Socket.io server on app load
3. Listen for `location:update` — update marker position
4. Show each child as a named map marker with avatar
5. Tap a marker → bottom sheet with child name, battery %, last seen time
6. "Center on child" button

Deliverable: Parent sees child moving on map in real-time

---

## Skill 8 — Geofencing + Push Notifications ⬜
**Goal:** Alert parent when child leaves a defined zone.

Steps:
1. Parent can draw/place a circle on the map (name + radius)
2. Save geofence to backend (`POST /geofences`)
3. On each location update, server checks if child is inside all geofences
4. If child exits a geofence → send push notification to parent via expo-notifications
5. Parent sees geofence circles on map (toggle on/off)

Deliverable: Parent receives push alert when test child leaves geofence

---

## Skill 9 — Location History ⬜
**Goal:** Parent can view where a child has been.

Steps:
1. History screen: date picker → shows trail on map for that day
2. Polyline drawn on map connecting location points
3. Timeline list below map (time + address via reverse geocode)
4. Export as CSV option

Deliverable: Parent can replay child's route for any day in the past 30 days

---

## Skill 10 — Polish & Deploy ⬜
**Goal:** App is production-ready and deployed.

Steps:
1. Error handling + loading states on all screens
2. Offline detection (notify user if no internet)
3. App icons + splash screen design
4. Deploy backend to Railway or Render
5. Configure EAS Build for iOS + Android
6. Submit to TestFlight (iOS) and Play Store internal testing (Android)
7. Write basic README

Deliverable: App installable on real devices via TestFlight / Play Store

---

## Progress Tracker

| Skill | Name                          | Status |
|-------|-------------------------------|--------|
| 1     | Project Scaffold              | ⬜     |
| 2     | Database Schema               | ⬜     |
| 3     | Backend Auth API              | ⬜     |
| 4     | Location API + WebSockets     | ⬜     |
| 5     | Mobile Auth Screens           | ⬜     |
| 6     | Child Background Location     | ⬜     |
| 7     | Parent Map View               | ⬜     |
| 8     | Geofencing + Notifications    | ⬜     |
| 9     | Location History              | ⬜     |
| 10    | Polish & Deploy               | ⬜     |
