#!/bin/bash
# Setup script to create .env file for backend

cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://roots_user:roots_password@localhost:5432/roots_of_impact
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
BASE_URL=http://localhost:5000
HOTELKIT_API_URL=
HOTELKIT_API_KEY=
SIHOT_USE_MOCK=true
SIHOT_API_URL=
SIHOT_API_KEY=
SIHOT_TIMEOUT_MS=15000
SIHOT_SYNC_INTERVAL_MS=900000
HOTEL_ID=ROI-BER
VOUCHER_API_URL=
VOUCHER_API_KEY=
UPLOAD_DIR=./uploads

# Email Configuration
EMAIL_ENABLED=true
EMAIL_MOCK_MODE=true
EMAIL_FROM=noreply@roots-of-impact.com
EMAIL_FROM_NAME=Roots of Impact
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# SMTP Configuration (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@roots-of-impact.com

# OAuth Configuration
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Apple OAuth (Sign in with Apple)
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_CALLBACK_URL=http://localhost:5000/api/auth/apple/callback
EOF

echo "Created .env file successfully!"
