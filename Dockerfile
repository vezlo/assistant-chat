# Use Node.js 20 LTS (Debian-based for better native module compatibility)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build with native modules)
RUN npm ci

# Copy source code
COPY . .

# Clean any existing build and build fresh
RUN npm run clean && npm run build

# Expose port
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev"]


