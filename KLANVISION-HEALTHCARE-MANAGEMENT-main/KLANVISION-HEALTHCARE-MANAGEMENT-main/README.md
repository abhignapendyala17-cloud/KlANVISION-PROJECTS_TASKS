# Smart Healthcare Appointment & Management System

A MERN application for patient registration, doctor discovery, appointment scheduling, and role-based healthcare administration.

## Requirements

- Node.js 20 or newer and npm
- Either the included persistent local MongoDB runner or a MongoDB Atlas cluster

## Setup on Windows

1. Open PowerShell in the project folder and install the API dependencies:

   ```powershell
   cd server
   npm install
   ```

2. Create `server\.env` by copying the example, then set `MONGO_URI` to `mongodb://127.0.0.1:27017/healthcare`, replace `JWT_SECRET` with a long random value, and choose a private initial admin password:

   ```powershell
   Copy-Item .env.example .env
   # Edit .env and set MONGO_URI, JWT_SECRET, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD.
   ```

   The local runner stores real MongoDB files under `server\data\mongodb` and keeps them between restarts. For Atlas instead, set `MONGO_URI` to your private Atlas connection string and skip the local database runner. Create an Atlas database user and allow your computer's IP address in **Network Access**.

3. In a separate PowerShell window, start the local database and leave it running:

   ```powershell
   cd server
   npm run db:start
   ```

   The first start downloads the MongoDB server binary. The server listens on `127.0.0.1:27017`; its data directory is on disk, not in-memory.

4. In another PowerShell window, create the initial administrator if no admin account already exists:

   ```powershell
   cd server
   npm run seed
   ```

   The email and password are read from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`; the seed command never prints the password or changes existing accounts.

5. Start the API in a PowerShell window:

   ```powershell
   cd server
   npm run dev
   ```

   The API listens on `http://127.0.0.1:5000`. Check `http://127.0.0.1:5000/api/health`; readiness is reported only when MongoDB is connected.

6. In another PowerShell window, install and start the React app:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

The Vite client uses `http://127.0.0.1:5000/api` by default. To use a different API URL, create `client\.env.local` with `VITE_API_URL=https://your-api-host/api`.

## Useful commands

Run backend API and utility tests:

```powershell
cd server
npm test
```

Build the frontend for production:

```powershell
cd client
npm run build
```

## Features

- Patient registration, JWT login/logout with token revocation, current-user lookup; passwords are hashed with bcrypt.
- Role-based patient, doctor, and administrator views with protected navigation.
- Doctor search by name or specialty with debounced requests.
- Slot-based booking, date validation, appointment cancellation and rescheduling.
- Unique MongoDB partial index preventing concurrent active bookings for the same doctor/date/time.
- Doctor appointment list and completion status; patient and doctor appointment history.
- Administrator doctor management, patient directory, and all-appointment visibility.
- Responsive interface, form validation, loading indicators, and toast feedback.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/doctors?q=...`, `POST /api/doctors`, `PUT /api/doctors/:id`, `DELETE /api/doctors/:id`
- `GET /api/patients`, `GET /api/patients/me`
- `GET /api/appointments?period=upcoming|previous`, `POST /api/appointments`
- `GET /api/appointments/history`
- `PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/reschedule`
- `PATCH /api/appointments/:id/status`
- `GET /api/health`

Protected endpoints require `Authorization: Bearer <token>`. Patient and doctor appointment lists are scoped to the authenticated profile; administrators can view all appointments.

## Notes

- Registration is patient-only. The seed script creates an initial administrator only when no administrator exists; administrators create doctor accounts.
- Appointments store the calendar date as UTC midnight and time slots as 24-hour `HH:MM` strings.
- Removing a doctor also removes that doctor's appointments and account.
