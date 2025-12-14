FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install && npm install tsx --save-dev

# Fix @ara-web/smartcontracts package.json: add exports for main and abis.ts path
RUN node -e "const fs = require('fs'); const pkgPath = './node_modules/@ara-web/smartcontracts/package.json'; const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); pkg.exports = { '.': { types: './abis.ts', default: './abis.ts' }, './abis.ts': { types: './abis.ts', default: './abis.ts' } }; fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));"

# Copy source code
COPY server-side/ ./server-side/

# Expose the port (default PORT env var should be set)
EXPOSE 5555

# Run the server
CMD ["npm", "run", "dev"]

