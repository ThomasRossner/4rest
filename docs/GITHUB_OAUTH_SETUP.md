# GitHub OAuth Setup Guide

This guide explains how to set up GitHub OAuth authentication for the Roots of Impact platform.

## Prerequisites

- A GitHub account
- Backend server running
- Database migrations applied

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App"
4. Fill in the application details:
   - **Application name**: Roots of Impact (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (development) or your production URL
   - **Authorization callback URL**: 
     - Development: `http://localhost:5000/api/auth/github/callback`
     - Production: `https://your-backend-domain.com/api/auth/github/callback`
5. Click "Register application"
6. Copy the **Client ID** and generate a **Client Secret**

## Step 2: Configure Environment Variables

Add the following variables to your `backend/.env` file:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# Session Secret (for Passport.js sessions)
SESSION_SECRET=your_random_session_secret_key_here

# Backend URL (optional, defaults to http://localhost:5000)
BACKEND_URL=http://localhost:5000
```

**Important Security Notes:**
- Never commit `.env` files to version control
- Use strong, random values for `SESSION_SECRET`
- In production, use HTTPS URLs
- Keep your `GITHUB_CLIENT_SECRET` secure

## Step 3: Run Database Migration

The OAuth support requires database schema changes. Run the migration:

```bash
cd backend
npm run migrate
```

This will:
- Make `password_hash` optional (for OAuth users)
- Add OAuth fields (`oauth_provider`, `oauth_id`, `oauth_email`)
- Create indexes for OAuth lookups

## Step 4: Install Dependencies

The required packages should already be in `package.json`, but if needed:

```bash
cd backend
npm install passport passport-github2 express-session
npm install --save-dev @types/passport @types/passport-github2 @types/express-session
```

## Step 5: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:3000/login`
4. Click "Continue with GitHub"
5. You should be redirected to GitHub for authorization
6. After authorizing, you'll be redirected back and logged in

## How It Works

1. **User clicks "Continue with GitHub"** → Redirects to `/api/auth/github`
2. **Passport.js redirects to GitHub** → User authorizes the app
3. **GitHub redirects back** → `/api/auth/github/callback`
4. **Backend creates/updates user** → Using GitHub profile data
5. **JWT token generated** → User is logged in
6. **Redirect to frontend** → `/auth/callback?token=...`
7. **Frontend stores token** → User is authenticated

## Account Linking

If a user with the same email already exists (from email/password registration), the GitHub account will be automatically linked to the existing account.

## Troubleshooting

### "OAuth authentication failed"
- Check that `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- Verify the callback URL matches exactly in GitHub OAuth App settings
- Ensure the backend server is running and accessible

### "Token generation failed"
- Check that `JWT_SECRET` is set in `.env`
- Verify the user was created successfully in the database

### "Callback URL mismatch"
- The callback URL in GitHub OAuth App must match `GITHUB_CALLBACK_URL` exactly
- Include the full URL with protocol (http/https) and port

### Database errors
- Ensure migration `003_oauth_support.sql` has been applied
- Check database connection and permissions

## Production Deployment

For production:

1. Update GitHub OAuth App callback URL to production backend URL
2. Use HTTPS for all URLs
3. Set strong `SESSION_SECRET` and `JWT_SECRET`
4. Use secure session cookies (already configured in code)
5. Update `FRONTEND_URL` and `BACKEND_URL` to production URLs

## Security Considerations

- Always use HTTPS in production
- Keep OAuth secrets secure (use environment variables, never commit)
- Session cookies are secure in production (secure flag set)
- OAuth tokens are not stored (only used for initial authentication)
- JWT tokens are used for subsequent API authentication

## Additional Providers

This setup can be extended to support other OAuth providers (Google, Facebook, etc.) by:
1. Installing the appropriate Passport strategy
2. Adding configuration in `backend/src/config/passport.ts`
3. Adding routes in `backend/src/routes/auth.routes.ts`
4. Adding UI buttons in `frontend/src/pages/LoginPage/LoginPage.tsx`

