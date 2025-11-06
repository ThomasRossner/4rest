import 'dotenv/config';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import axios from 'axios';
import { getUserByOAuth, getUserByEmail, createOrUpdateOAuthUser } from '../services/user.service.js';

// Serialize user for session (we're using JWT, so minimal)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const { getUserById } = await import('../services/user.service.js');
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub OAuth Strategy - only initialize if credentials are provided
const baseUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    'github',
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || `${baseUrl}/api/auth/github/callback`,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('GitHub OAuth callback - Profile data:', JSON.stringify(profile, null, 2));
          
          // Try to get email from profile first
          let email = profile.emails?.[0]?.value || profile._json?.email || null;
          
          // If email is not in profile, fetch it from GitHub API
          if (!email && accessToken) {
            try {
              console.log('GitHub OAuth: Email not in profile, fetching from GitHub API...');
              console.log('GitHub OAuth: Access token length:', accessToken?.length);
              
              // GitHub OAuth tokens use 'token' format, not 'Bearer'
              const response = await axios.get('https://api.github.com/user/emails', {
                headers: {
                  'Authorization': `token ${accessToken}`,
                  'User-Agent': 'Roots-of-Impact-OAuth',
                  'Accept': 'application/vnd.github.v3+json',
                },
              });
              
              const emails = response.data;
              console.log('GitHub OAuth: Received emails from API:', emails?.length || 0);
              
              // Find primary email or first verified email
              const primaryEmail = emails.find((e: any) => e.primary && e.verified);
              const verifiedEmail = emails.find((e: any) => e.verified);
              email = primaryEmail?.email || verifiedEmail?.email || emails[0]?.email || null;
              console.log(`GitHub OAuth: Fetched email from API: ${email}`);
            } catch (error: any) {
              console.error('GitHub OAuth: Failed to fetch email from API');
              console.error('GitHub OAuth: Status:', error.response?.status);
              console.error('GitHub OAuth: Status text:', error.response?.statusText);
              console.error('GitHub OAuth: Response data:', error.response?.data);
              console.error('GitHub OAuth: Error message:', error.message);
              
              // If 403, it might be a scope issue - check if user:email scope was granted
              if (error.response?.status === 403) {
                console.warn('GitHub OAuth: 403 Forbidden - The user:email scope was likely not granted');
                console.warn('GitHub OAuth: User will be created without email. To get email:');
                console.warn('GitHub OAuth: 1. Go to GitHub Settings > Applications > Authorized OAuth Apps');
                console.warn('GitHub OAuth: 2. Revoke access for this app');
                console.warn('GitHub OAuth: 3. Re-authorize the app (it will request user:email scope)');
              }
              
              // Continue without email - it's optional for OAuth users
              console.log('GitHub OAuth: Continuing user creation without email');
            }
          }
          
          const username = profile.username || profile.displayName || profile._json?.login || 'github_user';
          const name = profile.displayName || profile._json?.name || profile._json?.login || username || 'GitHub User';
          const avatarUrl = profile.photos?.[0]?.value || profile._json?.avatar_url || null;
          const githubId = profile.id?.toString() || profile._json?.id?.toString();

          if (!githubId) {
            console.error('GitHub OAuth: No GitHub ID found in profile');
            return done(new Error('GitHub profile missing ID'), null);
          }

          console.log(`GitHub OAuth: Processing user - ID: ${githubId}, Email: ${email || 'none'}, Name: ${name}`);

          // Check if user already exists with this OAuth ID
          let user = await getUserByOAuth('github', githubId);

          if (user) {
            console.log(`GitHub OAuth: User already exists with OAuth ID ${githubId}`);
            return done(null, user);
          }

          // Check if user exists with same email (account linking)
          if (email) {
            const existingUser = await getUserByEmail(email);
            if (existingUser && !existingUser.oauth_provider) {
              console.log(`GitHub OAuth: Linking to existing user with email ${email}`);
              // Link OAuth to existing account
              user = await createOrUpdateOAuthUser({
                userId: existingUser.id,
                oauthProvider: 'github',
                oauthId: githubId,
                oauthEmail: email,
                name: name || existingUser.name,
                avatarUrl: avatarUrl || existingUser.avatar_url,
              });
              console.log(`GitHub OAuth: User linked successfully - ID: ${user.id}`);
              return done(null, user);
            }
          }

          // Create new user
          console.log(`GitHub OAuth: Creating new user - GitHub ID: ${githubId}, Name: ${name}, Email: ${email || 'none'}`);
          user = await createOrUpdateOAuthUser({
            oauthProvider: 'github',
            oauthId: githubId,
            email: email || null,
            oauthEmail: email || null,
            name: name,
            role: 'guest',
            avatarUrl: avatarUrl || null,
          });

          console.log(`GitHub OAuth: User created successfully - ID: ${user.id}, Email: ${user.email || user.oauth_email}`);
          return done(null, user);
        } catch (error: any) {
          console.error('GitHub OAuth callback error:', error);
          console.error('Error details:', error.message, error.stack);
          return done(error, null);
        }
      }
    )
  );
  console.log('✓ GitHub OAuth strategy initialized');
} else {
  console.log('⚠ GitHub OAuth credentials not provided - GitHub login disabled');
  console.log('   Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable GitHub OAuth');
}

export default passport;

