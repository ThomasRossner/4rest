import 'dotenv/config';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as AppleStrategy } from 'passport-apple';
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

// Helper function to handle OAuth user creation/linking
async function handleOAuthUser(
  provider: string,
  providerId: string,
  email: string | null,
  name: string,
  avatarUrl: string | null,
  done: any
) {
  try {
    console.log(`${provider} OAuth: Processing user - ID: ${providerId}, Email: ${email || 'none'}, Name: ${name}`);

    // Check if user already exists with this OAuth ID
    let user = await getUserByOAuth(provider, providerId);

    if (user) {
      console.log(`${provider} OAuth: User already exists with OAuth ID ${providerId}`);
      return done(null, user);
    }

    // Check if user exists with same email (account linking)
    if (email) {
      const existingUser = await getUserByEmail(email);
      if (existingUser && !existingUser.oauth_provider) {
        console.log(`${provider} OAuth: Linking to existing user with email ${email}`);
        // Link OAuth to existing account
        user = await createOrUpdateOAuthUser({
          userId: existingUser.id,
          oauthProvider: provider,
          oauthId: providerId,
          oauthEmail: email,
          name: name || existingUser.name,
          avatarUrl: avatarUrl || existingUser.avatar_url,
        });
        console.log(`${provider} OAuth: User linked successfully - ID: ${user.id}`);
        return done(null, user);
      }
    }

    // Create new user
    console.log(`${provider} OAuth: Creating new user - ${provider} ID: ${providerId}, Name: ${name}, Email: ${email || 'none'}`);
    user = await createOrUpdateOAuthUser({
      oauthProvider: provider,
      oauthId: providerId,
      email: email || null,
      oauthEmail: email || null,
      name: name,
      role: 'guest',
      avatarUrl: avatarUrl || null,
    });

    console.log(`${provider} OAuth: User created successfully - ID: ${user.id}, Email: ${user.email || user.oauth_email}`);
    return done(null, user);
  } catch (error: any) {
    console.error(`${provider} OAuth callback error:`, error);
    console.error('Error details:', error.message, error.stack);
    return done(error, null);
  }
}

// OAuth Strategies - only initialize if credentials are provided
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

          return handleOAuthUser('github', githubId, email, name, avatarUrl, done);
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

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('Google OAuth callback - Profile data:', JSON.stringify(profile, null, 2));
          
          const email = profile.emails?.[0]?.value || null;
          const name = profile.displayName || profile.name?.givenName || profile.name?.familyName || 'Google User';
          const avatarUrl = profile.photos?.[0]?.value || null;
          const googleId = profile.id;

          if (!googleId) {
            console.error('Google OAuth: No Google ID found in profile');
            return done(new Error('Google profile missing ID'), null);
          }

          return handleOAuthUser('google', googleId.toString(), email, name, avatarUrl, done);
        } catch (error: any) {
          console.error('Google OAuth callback error:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log('✓ Google OAuth strategy initialized');
} else {
  console.log('⚠ Google OAuth credentials not provided - Google login disabled');
  console.log('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google OAuth');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    'facebook',
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${baseUrl}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('Facebook OAuth callback - Profile data:', JSON.stringify(profile, null, 2));
          
          const email = profile.emails?.[0]?.value || null;
          const name = profile.displayName || profile.name?.givenName || profile.name?.familyName || 'Facebook User';
          const avatarUrl = profile.photos?.[0]?.value || null;
          const facebookId = profile.id;

          if (!facebookId) {
            console.error('Facebook OAuth: No Facebook ID found in profile');
            return done(new Error('Facebook profile missing ID'), null);
          }

          return handleOAuthUser('facebook', facebookId.toString(), email, name, avatarUrl, done);
        } catch (error: any) {
          console.error('Facebook OAuth callback error:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log('✓ Facebook OAuth strategy initialized');
} else {
  console.log('⚠ Facebook OAuth credentials not provided - Facebook login disabled');
  console.log('   Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to enable Facebook OAuth');
}

// Apple OAuth Strategy (Sign in with Apple)
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  // @ts-ignore - passport-apple types may not fully match passport Strategy interface
  passport.use(
    'apple',
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        callbackURL: process.env.APPLE_CALLBACK_URL || `${baseUrl}/api/auth/apple/callback`,
      },
      async (accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
        try {
          console.log('Apple OAuth callback - Profile data:', JSON.stringify(profile, null, 2));
          
          // Apple provides email in the idToken or profile
          const email = profile?.email || idToken?.email || null;
          const name = profile?.name?.firstName || profile?.name?.lastName || profile?.displayName || 'Apple User';
          const appleId = profile?.id || idToken?.sub;

          if (!appleId) {
            console.error('Apple OAuth: No Apple ID found in profile');
            return done(new Error('Apple profile missing ID'), null);
          }

          return handleOAuthUser('apple', appleId.toString(), email, name, null, done);
        } catch (error: any) {
          console.error('Apple OAuth callback error:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log('✓ Apple OAuth strategy initialized');
} else {
  console.log('⚠ Apple OAuth credentials not provided - Apple login disabled');
  console.log('   Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY to enable Apple OAuth');
}

export default passport;

