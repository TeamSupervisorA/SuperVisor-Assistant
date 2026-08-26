# Supervisor Assistant — project interview guide

## One-minute explanation

Supervisor Assistant is a role-based academic project workspace. An institution administrator provisions departments and supervisors. Students form one canonical project roster, invite a supervisor, and execute approved work through tasks. A student can start only an assigned task, attach a file, HTTPS link, or written evidence, and submit the task for review. Submission moves the task to the supervisor's review queue; it does not complete it. Only the assigned supervisor can accept the evidence and move the task to Completed, or return it for revision. Important mutations are recorded in the audit log and important workflow events create notifications.

## Architecture

- `frontend/`: React and Vite interface. Pages call the backend through `frontend/src/lib/api.js`; authentication state and the active project are shared through the auth context.
- `backend/server.js`: Express entry point, security middleware, rate limits, routes, database startup, health endpoint, and audit middleware.
- `backend/routes/`: HTTP route definitions with authentication and role gates.
- `backend/controllers/`: workflow and authorization logic. Controllers do not trust role, ownership, status, grade, or project identifiers supplied by the browser.
- `backend/models/`: Mongoose schemas for institutions, users, projects, tasks, submissions, notifications, evaluations, meetings, and audit records.
- `backend/utils/projectAccess.js`: the shared institution and project access boundary.
- `backend/services/`: audit, email, integrity, AI, compiler, and related service integrations.
- MongoDB Atlas: application records and GridFS file storage. Files are buffered in memory, type/size checked, stored in MongoDB, and downloaded only by authenticated users in the same institution.

## Task state machine

```text
Planned -> In progress -> Review -> Completed
                 |           |
                 v           v
              Blocked     Revision -> In progress
```

- Supervisor/admin/project leader: create and allocate official work according to project capabilities.
- Other students: propose tasks; a proposal is not official until accepted.
- Assigned student: start, block with a reason, attach evidence, and submit for review.
- Assigned supervisor: review submitted evidence, accept it, or return actionable revision feedback.
- No student endpoint can mark an official task complete.

## End-to-end demonstration

1. As an administrator, create/verify the institution, departments, and supervisor accounts.
2. As a student, create a project, invite another student, and show that access begins only after acceptance.
3. Invite a supervisor and show that supervision access begins only after acceptance.
4. As the supervisor or project leader, create an official task with owner, due date, outcome, milestone, and dependency.
5. As the assigned student, move it to In progress and choose **Submit work**.
6. Attach a PDF/file, HTTPS evidence link, or completion notes and submit it.
7. Show the supervisor notification and Review column.
8. As the supervisor, request a revision, then accept the revised evidence.
9. Show Completed progress, submission history, notifications, and immutable audit history.

## Security points to explain

- JWT authentication plus active-account and onboarding checks.
- Server-side role, institution, project membership, assignment, and state-transition authorization.
- Cross-institution data isolation; browser filters are not security controls.
- File type and 10 MB limits, randomized stored names, protected downloads, private caching, and `nosniff` headers.
- HTTPS-only external evidence links.
- Rate limiting, Helmet headers, input length limits, mass-assignment allowlists, dependency-cycle checks, and safe errors.
- Passwords are bcrypt-hashed and secrets remain in deployment environment variables.

## Operational checks

- Backend health: `GET /api/health` must report a connected database.
- Backend workflow: `npm run test:smoke`.
- Integrity engine: `npm run test:integrity`.
- Frontend: `npm run lint` and `npm run build`.
- Dependency review: `npm audit --omit=dev` in both application directories.

Project support: `suprevisorassistant@gmail.com`.
