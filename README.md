# OnTrack

OnTrack is a web-based workforce management system made for janitorial and facility maintenance companies.

The goal of the project is to replace spreadsheets, paper schedules, and separate clock-in tools with one simple platform. Employees can check their shifts, clock in and out, request leave, and view their work information. Managers can create schedules, review leave requests, manage staff, and view workforce analytics.

This project was built as a SAIT Software Development capstone project.

## Live Demo

**OnTrack:** https://ontrack-client.azurewebsites.net/

---

## Main Features

* Secure login and password reset using Supabase Auth
* Role-based access for Cleaner, Foreman, General Manager, Owner/Admin, and Super Admin
* Employee and manager dashboards
* Weekly shift scheduling
* Leave request submission, approval, rejection, and cancellation
* Approved leave shown directly on the weekly schedule
* GPS-supported clock-in and clock-out
* Timesheet and attendance tracking
* Task management
* Account and project management
* Light and dark mode
* Responsive layout for desktop and mobile
* AI-powered summaries and analytics
* Docker support for the frontend and backend services
* Azure deployment using GitHub Actions

---

## User Roles

### Cleaner / Employee

Cleaners can:

* View assigned shifts
* Clock in and out
* View attendance and timesheets
* Submit leave requests
* Cancel pending leave requests
* View tasks
* Update personal settings
* Log out securely

### Foreman / Manager

Foremen can:

* View team schedules
* Review employee leave requests
* Approve or reject leave requests
* View attendance information
* Manage daily team activity
* Access manager-level dashboard information

### General Manager / Owner

General Managers and Owners can:

* View company-wide workforce information
* Manage employees and accounts
* Create and update schedules
* Review leave requests
* View analytics and AI summaries
* Manage projects and staffing
* Access higher-level administrative features

### Super Admin

The Super Admin role is used for platform-level administration and account management.

---

## Tech Stack

### Frontend

* Next.js App Router
* React 19
* JavaScript / JSX
* Tailwind CSS 4
* Lucide React
* Recharts
* Supabase client libraries

### Backend

* Node.js
* Express.js
* Supabase PostgreSQL
* Supabase Auth
* REST APIs
* Microservice architecture

### AI and Deployment

* Anthropic Claude API
* Docker
* Azure Web Apps
* Azure Container Registry
* GitHub Actions

---

## Project Structure

```text
OnTrack/
├── client/                         # Next.js frontend
│   ├── app/                        # Pages and API routes
│   │   ├── (app)/                  # Logged-in application pages
│   │   ├── analytics/              # Analytics page
│   │   ├── api/                    # Next.js API routes
│   │   └── auth/                   # Login and password pages
│   ├── components/                 # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Supabase and helper files
│   ├── public/                     # Logo and public images
│   ├── utils/                      # Utility functions
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── backend/
│   ├── scheduling-service/         # Shift scheduling API - port 4001
│   ├── clock-services/             # Clock-in/out API - port 4002
│   ├── leave-service/              # Leave request API - port 4003
│   ├── auth-services/              # Authentication API - port 4004
│   └── ai-service/                 # AI summaries and analytics - port 4005
│
├── .github/
│   └── workflows/                  # GitHub Actions deployment workflows
│
└── README.md
```

Each backend folder is its own Express microservice. Every service has its own `package.json`, `Dockerfile`, source files, and `.env` file.

---

## How the Microservices Work

OnTrack separates major backend features into smaller services.

| Service            | Purpose                                         | Default Port |
| ------------------ | ----------------------------------------------- | -----------: |
| Scheduling Service | Creates, updates, and returns shift schedules   |         4001 |
| Clock Service      | Handles clock-in and clock-out records          |         4002 |
| Leave Service      | Handles leave requests and approvals            |         4003 |
| Auth Service       | Handles login, signup, logout, and verification |         4004 |
| AI Service         | Creates AI summaries and workforce insights     |         4005 |

This setup makes it easier to test, update, deploy, and scale each part separately.

---

## Requirements

Before running the project, install:

* Node.js 22 or newer
* npm
* Git
* Docker Desktop
* A Supabase project


Docker is optional for local development, but it is used for deployment and container testing.

---

## Environment Files

Environment files are private and must never be pushed to GitHub.

Make sure `.env`, `.env.local`, `node_modules`, and `.next` are included in `.gitignore`.

### Frontend Environment File

Create:

```text
client/.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:4005
SCHEDULING_SERVICE_URL=http://localhost:4001
```

The frontend must only use the Supabase public anon or publishable key.

Never place these values in the frontend:

* `SUPABASE_SERVICE_ROLE_KEY`
* `ANTHROPIC_API_KEY`

### Backend Environment Files

Create a separate `.env` inside every backend service folder.

Example:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4001
```

Use the correct port for each service:

```text
Scheduling: 4001
Clock:      4002
Leave:      4003
Auth:       4004
AI:         4005
```

The AI service also needs:

```env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

> The Supabase service-role key and Anthropic API key are private backend secrets. Never send them in chat, place them in frontend files, or commit them to GitHub.

---

## Installing Project Dependencies

After cloning or pulling the project, install the required packages before running it.

### Frontend

Open a terminal inside the `client` folder:

```bash
cd client
npm install
```

The main frontend packages include:

```bash
npm install recharts lucide-react cmdk
```

`npm install` should normally install everything listed in `client/package.json`, including these packages. The second command is mainly useful if one of them is missing and the build shows a `Module not found` error.

### Backend Services

Each backend microservice has its own `package.json`, so dependencies must be installed separately inside every service folder:

```bash
cd backend/scheduling-service
npm install

cd ../clock-services
npm install

cd ../leave-service
npm install

cd ../auth-services
npm install

cd ../ai-service
npm install
```

You only need to run these install commands again when:

* You clone the project for the first time
* A teammate adds or updates a package
* `package.json` or `package-lock.json` changes
* The `node_modules` folder was deleted

Do not upload or commit the `node_modules` folders to GitHub.

---

## Run the Frontend Locally

Open a terminal:

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

To test a production build:

```bash
npm run build
npm start
```

---

## Run the Frontend with Docker

Make sure Docker Desktop is running.

From the `client` folder:

```bash
cd client
docker compose --env-file .env.local up --build
```

Open:

```text
http://localhost:3000
```

To stop the container:

```bash
docker compose down
```

To rebuild without using old cache:

```bash
docker compose --env-file .env.local build --no-cache
docker compose --env-file .env.local up
```

---

## Run the Full Project Locally

The easiest way is to use one terminal for the frontend and one terminal for each backend service.

### Terminal 1 - Frontend

```bash
cd client
npm install
npm run dev
```

### Terminal 2 - Scheduling Service

```bash
cd backend/scheduling-service
npm install
npm run dev
```

### Terminal 3 - Clock Service

```bash
cd backend/clock-services
npm install
npm run dev
```

### Terminal 4 - Leave Service

```bash
cd backend/leave-service
npm install
npm run dev
```

### Terminal 5 - Auth Service

```bash
cd backend/auth-services
npm install
npm run dev
```

### Terminal 6 - AI Service

```bash
cd backend/ai-service
npm install
npm run dev
```

Keep all terminals open while testing the complete system.

---

## Health Checks

Each backend service should provide a health route.

Examples:

```bash
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
curl http://localhost:4005/health
```

A working service should return a success message or JSON response.

---

## Main API Endpoints

### Auth Service - Port 4004

```text
POST /signup
POST /login
POST /logout
GET  /verify
GET  /health
```

### Scheduling Service - Port 4001

```text
GET    /schedules
POST   /schedules
GET    /schedules/:id
PATCH  /schedules/:id
DELETE /schedules/:id
GET    /schedules/assignable-employees
GET    /health
```

### Clock Service - Port 4002

```text
GET  /clock
POST /clock/in
POST /clock/out/:id
GET  /health
```

### Leave Service - Port 4003

```text
GET    /leave
POST   /leave
PATCH  /leave/:id
POST   /leave/:id/cancel
GET    /health
```

### AI Service - Port 4005

```text
GET /ai/context
GET /ai/summary
GET /health
```

Some routes may require a valid Supabase access token and the correct user role.

---

## Testing the AI Integration

1. Start the frontend.
2. Start the AI service on port `4005`.
3. Make sure `client/.env.local` contains:

```env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:4005
```

4. Make sure `backend/ai-service/.env` contains:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
PORT=4005
```

5. Log in with a manager, owner, or admin account.
6. Open the Analytics page.
7. Run an AI query or summary.
8. Check both the browser console and AI service terminal for errors.

---

## npm Commands

### Frontend

| Command         | Description                                      |
| --------------- | ------------------------------------------------ |
| `npm install`   | Installs project packages                        |
| `npm run dev`   | Runs the development server                      |
| `npm run build` | Creates a production build                       |
| `npm start`     | Runs the production build                        |
| `npm ci`        | Installs exact versions from `package-lock.json` |

### Backend Services

| Command       | Description                         |
| ------------- | ----------------------------------- |
| `npm install` | Installs service packages           |
| `npm run dev` | Runs the service with auto-restart  |
| `npm start`   | Runs the service in production mode |

---

## Deployment

The project uses GitHub Actions to deploy services to Azure.

The deployment workflows are stored inside:

```text
.github/workflows/
```

The frontend is deployed to an Azure Web App.

**Live frontend:** https://ontrack-client.azurewebsites.net/

Backend services are built as Docker images and deployed separately. This allows one service to be updated without redeploying the entire project.

Deployment normally happens when code is merged into the `main` branch. The workflows can also be started manually using GitHub Actions.

---

## Git Workflow

A simple workflow for team members:

```bash
git switch main
git pull origin main
git switch -c your-branch-name
```

After making and testing changes:

```bash
git status
git add .
git commit -m "Describe your changes"
git push -u origin your-branch-name
```

Then create a pull request into `main`.

Before pushing, always check that these files are not included:

```text
.env
.env.local
node_modules
.next
```

---

## Troubleshooting

### Next.js cannot find the app directory

Make sure commands are being run from the `client` folder:

```bash
cd client
npm run dev
```

The Next.js `app` folder should be located at:

```text
client/app
```

### Module not found for `@/client/...`

The frontend project root is already `client`.

Use imports like:

```js
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
```

Do not use:

```js
import useAuth from "@/client/hooks/useAuth";
```

### Recharts module not found

Run:

```bash
cd client
npm install recharts
```

### Environment changes are not working

Restart the development server.

For Docker or production builds, rebuild the frontend because `NEXT_PUBLIC_*` values are added at build time.

### Backend service exits immediately

Check that the service has a `.env` file.

Example:

```text
backend/leave-service/.env
```

### Supabase request is blocked

Check:

* The correct project URL
* The correct key
* Supabase Row-Level Security policies
* The user's role and login session

### Docker engine connection error

Open Docker Desktop and wait until it says the engine is running.

Test with:

```bash
docker version
```

Both Client and Server sections should appear.

### Docker cache or snapshot error

Restart Docker Desktop and run:

```bash
docker builder prune -af
```

Then rebuild the image.

### Port already in use

Find and stop the old process, or change the service port in its `.env` file.

---

## Security Notes

* Never commit environment files.
* Never expose the Supabase service-role key in the frontend.
* Never expose the Anthropic API key in the frontend.
* Use Supabase Row-Level Security.
* Validate user roles before allowing manager or admin actions.
* Validate GPS and attendance data on the server.
* Rotate any private key that was accidentally shared.

---

## Team

OnTrack was created by a five-member SAIT Software Development capstone team.

### Team Members

* Ayush Sainju - Project Manager and Frontend
* Henry Leung - Backend
* Samir Karki - Backend
* Sargam Kunwor - Backend
* Saif - Frontend

The team worked together using GitHub branches, pull requests, Jira tasks, Docker, Supabase, and Azure.

---

## Project Status

The project currently includes:

* Working frontend pages
* Authentication and role-based access
* Scheduling and leave management
* Attendance and clock features
* Separate backend microservices
* AI analytics integration
* Docker configuration
* Azure deployment workflows

Some features may still be improved as the capstone project continues.

---

## License

This project was created for educational purposes as part of the SAIT Software Development capstone course.
