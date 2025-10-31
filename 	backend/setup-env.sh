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
VOUCHER_API_URL=
VOUCHER_API_KEY=
UPLOAD_DIR=./uploads
EOF

echo "Created .env file successfully!"
