# Internet Cepat NOC

Next.js NOC dashboard using Neon Postgres, Drizzle ORM, Better Auth, and Vercel.

## Setup

1. Create a Neon project and put its pooled connection string in `DATABASE_URL`.
2. Copy `.env.example` to `.env.local` and set `BETTER_AUTH_SECRET` to a long random value.
3. Run `npm install`.
4. Run `npm run db:push` to create Neon and Better Auth tables.
5. Create the first account through Better Auth, then set its profile role to `admin` in Neon:

```sql
update profiles set role = 'admin' where email = 'admin@example.com';
```

6. Run `npm run dev`.

Better Auth handles email/password authentication, sessions, cookies, and account tables. The NOC `profiles` table stores admin/staff authorization data.

## Vercel

Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` to the Vercel deployment URL, then run:

```powershell
vercel deploy . -y
```
