# Clinic Booking System

A POC booking system for a kinesiology clinic built with Next.js 16 App Router.

## How to run the project

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to run tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

## Tech Stack

| | |
|---|---|
| Framework | Next.js (App Router) |
| UI | Tailwind, shadcn/ui |
| Testing | Vitest, React Testing Library |
| Storage | In-memory |
| Claude Code | Agent |

## Approach
- Architecture: I decided to organize the functionalities in three folders
  - app: pages, routes and bff/api, everything related with the site structure
  - components: atomic components
  - core: pure or business logic, types and interfaces and other shared units.

This approach is clean enough if we maintain the scope of a booking system, since it's clear to understand where something habit.

## Project development
Briefly I started setting the requirements specifically (like small user stories where I detailed the steps a user would do) to have a clear understanding of how the flow should be. I continued with the scaffolding and defining the structure. I added the basic interfaces, types and pure logic that I could need. The next step was routing, later components design and finally pages. Testing was a requirement to consider each piece of the application is finished.

## Business Rules

- Bookings are 30, 45, or 60 minutes
- No two bookings may overlap — conflicts are rejected with a clear error
- Start times are on 30-minute intervals (09:00–18:00)
- Bookings can only be made within the next 30 days

## Assumptions

- No authentication — the system is for internal clinic use
- In-memory storage, resets on server restart
- The global store pattern is used to share state between Server Components and API route handlers in Next.js dev mode
- Basic but usable UI with clear steps.

## Future improvements

- Replace in-memory store with a no relational database
- Full business approach (separate appointments by doctors or specialities if the clinic would have, consider non-working days and absences)
- Add date navigation for past appointments on the homepage
- Authentication and roles
- Management panel for admins
- An email/whatsapp messaging system, where users receive a remind and confirmation
- Better UI with responsive design and alternatives for contacting with the clinic
