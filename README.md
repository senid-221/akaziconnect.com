# AkaziConnect

AkaziConnect is a mobile-first employment platform that connects job seekers with employers in Rwanda.

## Current MVP
- Responsive Kinyarwanda/English homepage
- Job search by keyword and location
- Category filters
- Save-job interaction
- Application modal flow
- Job-seeker signup/login UI
- Employer post-job UI

## Planned production stack
- Frontend: current HTML/CSS/JS MVP, ready to migrate to React/Next.js if desired
- Backend: Supabase Auth + PostgreSQL + Storage
- Authentication: email/password sessions handled by Supabase Auth
- Storage: CV uploads and company logos
- Database: `supabase/schema.sql`

## Database setup
A dedicated Supabase project should be selected/created before running the schema. Do not use another existing project unless it is explicitly designated for AkaziConnect.

After the dedicated project is available, run `supabase/schema.sql`, then configure Storage buckets and connect the frontend using the project's publishable key. Never put a service-role/secret key in browser code.

## Roadmap
1. Connect Supabase Auth
2. Build job-seeker profile and CV upload
3. Build employer/company dashboard
4. Connect real jobs and applications
5. Add notifications and saved jobs persistence
6. Add admin moderation dashboard
7. Add search, matching and deployment configuration
