FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 5000

# Use development mode (no build needed, tsx handles it)
CMD ["npm", "run", "dev"]
