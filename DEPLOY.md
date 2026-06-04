# PRISM Performance System — Deployment Guide

## Prerequisites
- Supabase account (supabase.com) ✓
- Vercel account (vercel.com) ✓
- GitHub account (github.com) — needed for Vercel
- Anthropic API key (console.anthropic.com)
- Domain: avtrlife.com

---

## STEP 1 — Run the database migration

1. Go to supabase.com → your `prism-performance` project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `supabase/migrations/001_schema.sql` from this project
5. Copy the entire contents and paste into the SQL Editor
6. Click **Run** (▶ button)
7. You should see: "Success. No rows returned"

---

## STEP 2 — Set your account as practitioner

After running the migration, run this in the SQL Editor:
```sql
-- After you sign up on the app, run this to make your account a practitioner
-- Replace YOUR_EMAIL with robertbkye@gmail.com
UPDATE public.profiles
SET role = 'practitioner'
WHERE email = 'robertbkye@gmail.com';
```

---

## STEP 3 — Get your Supabase credentials

1. In Supabase → **Settings → API**
2. Copy:
   - **Project URL** → goes in `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → goes in `SUPABASE_SERVICE_ROLE_KEY`

---

## STEP 4 — Get your Anthropic API key

1. Go to console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key → goes in `ANTHROPIC_API_KEY`

---

## STEP 5 — Push to GitHub

```bash
cd prism-app
git init
git add .
git commit -m "Initial PRISM Performance System"
git branch -M main

# Create a new repo on github.com called 'prism-app', then:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/prism-app.git
git push -u origin main
```

---

## STEP 6 — Deploy to Vercel

1. Go to vercel.com → **Add New Project**
2. Click **Import** next to your `prism-app` GitHub repo
3. Vercel will detect Next.js automatically
4. Click **Environment Variables** and add all of these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `NEXT_PUBLIC_APP_URL` | https://prism.avtrlife.com |
| `PRACTITIONER_EMAIL` | robertbkye@gmail.com |

5. Click **Deploy**
6. Vercel will build and deploy — takes ~2 minutes
7. You'll get a URL like `prism-app-xxx.vercel.app` — test it here first

---

## STEP 7 — Connect your domain

1. In Vercel → your project → **Settings → Domains**
2. Add: `prism.avtrlife.com`
3. Vercel gives you DNS records — go to your domain registrar (where avtrlife.com is registered)
4. Add a CNAME record:
   - Name: `prism`
   - Value: `cname.vercel-dns.com`
5. Wait 5–15 minutes for DNS to propagate
6. Your app is live at **prism.avtrlife.com**

---

## STEP 8 — First login

1. Go to prism.avtrlife.com
2. Click "Sign up"
3. Use robertbkye@gmail.com
4. Check email for confirmation link
5. After confirming, run the SQL in Step 2 to set your role to practitioner
6. Sign in — you'll land on the practitioner dashboard

---

## Adding clients

1. In the practitioner dashboard → Add Client
2. Add their name, email, pillar, training age
3. Click "Send Invite"
4. Copy the invite link and send to your client (WhatsApp, email, etc.)
5. Client clicks link → creates their own login → sees their program instantly

---

## Costs summary

- Vercel: £0 (free tier)
- Supabase: £0 (free tier, up to 50k users)
- Anthropic API: ~£15–35/month at 10 active clients
- Domain: you already have avtrlife.com

Total monthly cost: ~£15–35 in API fees only.
