# LinkedIn Connect Feature — Setup Guide

This document describes how to enable and configure the **"Connect LinkedIn"** feature,
which allows users to link their LinkedIn profile to their FluencyCert account via OAuth.

## Feature Flag

The feature is controlled by the **`NEXT_PUBLIC_FLAG_LINKEDIN_CONNECT`** environment variable.

| Value   | Behavior                                         |
|---------|--------------------------------------------------|
| `true`  | LinkedIn section appears on the profile page.    |
| (unset) | LinkedIn section is hidden. All code is inert.   |

**How to enable:**

1. Follow the LinkedIn app registration steps below.
2. Set `NEXT_PUBLIC_FLAG_LINKEDIN_CONNECT=true` in your Vercel dashboard
   (under **Settings → Environment Variables**) and in `.env.local` for local dev.
3. Deploy.

## Prerequisites

1. A LinkedIn Developer account.
2. A registered LinkedIn app at https://www.linkedin.com/developers/apps.

## LinkedIn App Registration

### Step 1: Create an app

1. Go to https://www.linkedin.com/developers/apps
2. Click **Create app**.
3. Fill in:
   - **App name**: `FluencyCert`
   - **LinkedIn Page**: Your company page (or personal)
   - **App logo**: Upload your logo
4. Click **Create app**.

### Step 2: Add the "Verified on LinkedIn" product

1. In your app's dashboard, go to the **Products** tab.
2. Click **Add product** next to **"Verified on LinkedIn"**.
3. Accept the terms.

> The "Verified on LinkedIn" product is required — it provides the
> `/identityMe` endpoint which returns the user's public profile URL.
> Other products (OIDC, legacy Sign In) do not return the profile URL.

### Step 3: Configure OAuth 2.0 settings

1. Go to the **Auth** tab.
2. Under **OAuth 2.0 settings**, add redirect URLs:
   - `https://www.fluency-cert.pp.ua/linkedin/callback` (production)
   - `http://localhost:3000/linkedin/callback` (development)
3. Save.

### Step 4: Get your credentials

1. Go to the **Credentials** tab.
2. Copy the **Client ID** and **Client Secret**.

## Environment Variables

Add to `.env.local` (and Vercel dashboard):

```bash
# Feature flag (set to "true" to enable)
NEXT_PUBLIC_FLAG_LINKEDIN_CONNECT=true

# LinkedIn OAuth credentials
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id_here
```

## Tier Upgrade for Production

The **"Verified on LinkedIn"** product has three tiers:

| Tier    | Access                                    | Cost |
|---------|-------------------------------------------|------|
| Development | Self-serve. Only works for app admins. | Free |
| **Lite**    | Requires application review. Works for all members. | Free |
| Plus    | Business development approval. Enhanced data. | Free |

For development and testing with your own account, the **Development** tier
is sufficient. When you're ready for production with real users:

1. Follow the [Lite tier upgrade guide](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/verified-on-linkedin/guides/upgrade-to-lite-tier)
2. The application review typically takes a few business days.

## How It Works

```
User clicks "Connect LinkedIn"
         │
         ▼
Popup opens → LinkedIn OAuth consent screen
         │
         ▼
User authorizes → LinkedIn redirects to /linkedin/callback?code=...&state=...
         │
         ▼
Callback page posts code to opener via window.postMessage
         │
         ▼
Profile page sends { authorizationCode, redirectUri } → POST /api/linkedin/connect
         │
         ▼
Server exchanges code for access token
         │
         ▼
Server calls GET /identityMe with the access token
         │
         ▼
Server saves linkedin_url + linkedin_profile_data to profiles table
         │
         ▼
UI shows "Connected" with name, picture, and profile URL
```

## Files

| File | Purpose |
|------|---------|
| `src/app/api/linkedin/connect/route.ts` | POST (connect) + DELETE (disconnect) |
| `src/app/[lang]/linkedin/callback/page.tsx` | OAuth redirect handler (postMessage relay) |
| `src/components/linkedin/linkedin-connect.tsx` | Client component for "Connect LinkedIn" UI |
| `supabase/migrations/20260607000000_add_linkedin_fields.sql` | Adds `linkedin_profile_data` column |

## Troubleshooting

- **403 on `/identityMe`**: Make sure the "Verified on LinkedIn" product is added to your app.
- **"Not enough permissions"**: Verify you requested the `r_profile_basicinfo` scope during OAuth.
- **Redirect mismatch**: The redirect URL in your code must exactly match the one registered in the app settings (including `http://` vs `https://`).
- **Development tier only works for admins**: Add the LinkedIn account you're testing with as an admin of the app in the Developer Portal.
