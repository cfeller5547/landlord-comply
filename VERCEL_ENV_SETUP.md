# Vercel Environment Variables Setup

## Quick Setup Instructions

### 1. Go to Vercel Dashboard
https://vercel.com/cfeller5547s-projects/landlord-comply/settings/environment-variables

### 2. Add These Environment Variables

Click "Add New" and add each of these:

| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_TMktepk8_Cher5zYGajLEGPqoQWiXQNee` | Production, Preview, Development |
| `RESEND_FROM_EMAIL` | `LandlordComply <onboarding@resend.dev>` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | [Get from Supabase dashboard] | Production, Preview, Development |

### 3. Variables Already Set (Don't Duplicate)
These should already be in Vercel from your previous setup:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_AI_API_KEY`

### 4. After Adding Variables
1. Click "Save" for each variable
2. Your next deployment will automatically use these variables
3. You can trigger a redeployment from the Deployments tab if needed

## Testing the Email Feature

After deployment:
1. Go to https://landlord-comply.vercel.app/start
2. Fill in the form:
   - Address: Any address
   - State: California
   - City: San Francisco (if available)
   - Move-out date: Any future date
3. Click "Calculate Deadline + Requirements"
4. On the results page, enter your email
5. Click "Email My Packet Link"
6. Check your email for the branded message

## Troubleshooting

### If emails aren't sending:
- Check Vercel Functions logs: Dashboard → Functions tab
- Check Resend dashboard for failed attempts: https://resend.com/emails
- Verify all 3 environment variables are set in Vercel

### Common Issues:
- **"Missing RESEND_API_KEY"**: Environment variable not set in Vercel
- **"Invalid API key"**: Check if the key matches what's in Resend dashboard
- **"Missing SUPABASE_SERVICE_ROLE_KEY"**: Need to add this from Supabase dashboard