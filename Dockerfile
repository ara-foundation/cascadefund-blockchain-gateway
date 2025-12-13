FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Expose the port (default PORT env var should be set)
EXPOSE 5555

# Run the server
CMD ["npm", "run", "dev"]

