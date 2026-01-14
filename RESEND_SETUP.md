# Resend Email Setup Guide

## Current Status
- **Your Email**: landlordcomply@gmail.com
- **API Key**: Already in .env (starts with `re_TMktepk8_`)
- **From Email**: Currently using `onboarding@resend.dev` (development mode)

## Steps to Complete

### 1. Verify Domain in Resend (for production)

If you want to use `landlordcomply@gmail.com`:
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. For Gmail, you have two options:
   - **Option A**: Use a custom domain (recommended for production)
     - Buy a domain like `landlordcomply.com`
     - Add it to Resend
     - Verify DNS records
   - **Option B**: Continue using `onboarding@resend.dev` for now

**Note**: Gmail addresses (`@gmail.com`) cannot be directly verified in Resend. You need to own the domain.

### 2. Get Supabase Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/txziykaoatbqvihveasu/settings/api)
2. Find "Service Role Key" under Project API Keys
3. Copy the key (starts with `eyJ...`)
4. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in `.env`

### 3. Update Vercel Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables for Production:

```
RESEND_API_KEY = re_TMktepk8_Cher5zYGajLEGPqoQWiXQNee
RESEND_FROM_EMAIL = LandlordComply <onboarding@resend.dev>
SUPABASE_SERVICE_ROLE_KEY = [Your service role key from Supabase]
```

### 4. Test Email Sending

After setup, test the `/start` flow:
1. Go to https://landlord-comply.vercel.app/start
2. Fill in property details
3. Enter your email on the results page
4. Check if you receive the branded email

## Environment Variables Summary

### Required for Email Feature
- `RESEND_API_KEY` - Your Resend API key ✅
- `RESEND_FROM_EMAIL` - Sender email address ✅
- `SUPABASE_SERVICE_ROLE_KEY` - For generating magic links ⚠️ (needs to be added)

### Current .env Setup
```env
# Resend Configuration
RESEND_API_KEY="re_TMktepk8_Cher5zYGajLEGPqoQWiXQNee"
RESEND_FROM_EMAIL="LandlordComply <onboarding@resend.dev>"

# Supabase Service Role Key (needed for magic links)
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"  # ← UPDATE THIS
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit the real `SUPABASE_SERVICE_ROLE_KEY` to git
- Keep `.env` in `.gitignore`
- Only add sensitive keys to Vercel's environment variables

## Troubleshooting

### If emails aren't sending:
1. Check Resend dashboard for failed sends
2. Verify API key is correct
3. Check browser console for errors
4. Review Vercel function logs

### If magic links don't work:
1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check Supabase Auth settings
3. Verify redirect URL is configured in Supabase

## Next Steps

1. [ ] Get Supabase Service Role Key from dashboard
2. [ ] Update `.env` with the service role key
3. [ ] Add all 3 environment variables to Vercel
4. [ ] Deploy to Vercel (will auto-deploy on push)
5. [ ] Test the email flow on production