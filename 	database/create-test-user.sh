#!/bin/bash
# Script to create a test user via the API

echo "Creating test user..."

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "guest"
  }'

echo -e "\n\nTest user created!"
echo "You can now login with:"
echo "Email: test@example.com"
echo "Password: Test123!"
