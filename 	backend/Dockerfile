FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies without workspaces to ensure all deps are in local node_modules
RUN npm install --no-workspaces

# Copy source code
COPY . .

EXPOSE 5001

# Use development mode (no build needed, tsx handles it)
CMD ["npm", "run", "dev"]
