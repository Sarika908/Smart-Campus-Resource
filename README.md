# Smart Campus Resource Sharing - Backend

Node.js + Express + MongoDB backend for the Smart Campus Resource Sharing platform.

## Tech Stack
- Node.js, Express.js
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- node-cron (for return-deadline reminder job)

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Create a `.env` file (copy `.env.example`) and set:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart_campus_resource_sharing
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=7d
   ```
   **Team members:** use the SAME `JWT_SECRET` and `MONGO_URI` as the rest of the team
   (share it privately, e.g. via chat — never commit `.env` to GitHub).

3. Start MongoDB locally (or use MongoDB Atlas and put the connection string in MONGO_URI).

4. Run the server
   ```
   npm start
   ```
   or for auto-reload during development:
   ```
   npm run dev
   ```

Server runs at `http://localhost:5000`

## Folder Structure
```
smart-campus-backend/
├── config/db.js              -> MongoDB connection
├── models/                   -> User, Resource, Booking, Notification schemas
├── middleware/                -> auth.js (JWT check), role.js (role-based access)
├── controllers/               -> business logic for each module
├── routes/                    -> API route definitions
├── utils/                     -> generateToken.js, notify.js, reminderJob.js helpers
└── server.js                  -> app entry point
```

## User Roles
`Student`, `Faculty`, `Staff`, `Admin` — set at registration, changeable by Admin later.

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /register | Public | Register new user |
| POST | /login | Public | Login, returns JWT |
| GET | /profile | Private | Get own profile |
| PUT | /profile | Private | Update own profile |

### Resources (`/api/resources`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | / | Private | Share/list a new resource |
| GET | /?keyword=&category=&status= | Private | Search/filter resources |
| GET | /:id | Private | Get single resource |
| PUT | /:id | Private (owner/Admin) | Update resource |
| DELETE | /:id | Private (owner/Admin) | Delete resource |
| GET | /my/listings | Private | Resources shared by logged-in user |

### Bookings (`/api/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | / | Private | Request/reserve a resource |
| PUT | /:id/approve | Private (owner/Admin) | Approve request |
| PUT | /:id/reject | Private (owner/Admin) | Reject request |
| PUT | /:id/return | Private | Mark as returned |
| PUT | /:id/cancel | Private (requester) | Cancel own pending request |
| GET | /my | Private | Bookings made by logged-in user |
| GET | /incoming | Private | Incoming requests for resources you own |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Private | Get own notifications |
| PUT | /:id/read | Private | Mark notification as read |

### Admin (`/api/admin`) — all require Admin role
| Method | Endpoint | Description |
|---|---|---|
| POST | /create-user | Admin creates a Student/Faculty/Staff/Admin account (sets email/id and password directly) |
| GET | /users | List all users |
| PUT | /users/:id | Change role / activate-deactivate user |
| DELETE | /users/:id | Remove a user |
| GET | /bookings | View all bookings platform-wide |
| GET | /analytics | Dashboard stats: totals, bookings by status, resources by category, users by role, most requested resources |
| POST | /trigger-reminders | Manually run the return-deadline reminder check (for testing/demo) |

## Creating Users

There are two ways to create accounts:

**1. Self-registration (public)** — anyone can register themselves:
```
POST /api/auth/register
{ "name": "...", "email": "...", "password": "...", "role": "Student" }
```

**2. Admin-created accounts** — an Admin creates accounts for Student/Faculty/Staff
(or another Admin) and hands out the id/password:
```
POST /api/admin/create-user   (needs Admin Bearer token)
{ "name": "...", "email": "...", "password": "...", "role": "Faculty" }
```

**3. Seed script** — creates one default user per role directly in MongoDB, for quick testing:
```bash
npm run seed
```
This creates:
| Role | Email (user id) | Password |
|---|---|---|
| Admin | admin@campus.edu | admin123 |
| Student | student@campus.edu | student123 |
| Faculty | faculty@campus.edu | faculty123 |
| Staff | staff@campus.edu | staff123 |

Safe to run more than once — it skips any email that already exists instead of duplicating.
Change these values in `scripts/seedUsers.js` before running if you want different
credentials. **Change these passwords before using outside of local testing.**

## Return Deadline Reminders (Real-time Trigger)
`utils/reminderJob.js` uses **node-cron** to run automatically every day at 8:00 AM.
It scans all `Approved` bookings whose `toDate` is within 2 days, and sends a
"Reminder" notification to the borrower.

- Runs automatically once the server starts (scheduled via `startReminderJob()` in `server.js`).
- To test it immediately without waiting for 8 AM, call the manual trigger endpoint:
  ```
  POST /api/admin/trigger-reminders   (Admin only, needs Bearer token)
  ```
- Change the schedule by editing the cron pattern in `utils/reminderJob.js`
  (`cron.schedule("0 8 * * *", ...)` — currently "every day at 8:00 AM").
- Change the reminder window by editing `REMINDER_WINDOW_DAYS` in the same file.

## Auth Header
For all `Private` routes, send:
```
Authorization: Bearer <token>
```
(token received from /register or /login response)

## Git / GitHub Setup Note
This project uses a `.gitignore` file to keep `node_modules/` and `.env` out of
version control (since `.env` contains secrets like `JWT_SECRET` and `MONGO_URI`).
Only `.env.example` (dummy values) is committed. Before pushing to GitHub, run
`git status` and confirm `.env` is NOT listed. Each team member should create
their own local `.env` file using the shared `JWT_SECRET` / `MONGO_URI` sent
privately by the team (not through GitHub).

## Notes / Possible Extensions
- Add file upload (multer) for resource images / notes/book file attachments.
- Add pagination on GET /resources and /admin/bookings for large data sets.