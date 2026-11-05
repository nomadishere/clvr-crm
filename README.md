# CLVR CRM

- `/` — the public marketing site (clvrcrm.com). Static: `index.html`, `css/`, `js/`, `img/`, `shots/` (demo-data screenshots, no real customer data), `vendor/three` (pinned three.js).
- `/login/` — the CRM itself (clvrcrm.com/login). It loads the latest team app from nomadishere.github.io/lucky-line-crm and shows it under the CLVR name, so both always stay in sync. All customer data lives in Supabase behind sign-in, none in this repo.
- The signup form writes to `clvr.signups` through the insert-only `public.clvr_signup()` function.
