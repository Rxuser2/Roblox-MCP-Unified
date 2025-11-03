# Roblox MCP Node.js Server Docker Image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S roblox -u 1001

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    tini \
    curl

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY examples/ ./examples/
COPY tests/ ./tests/

# Create necessary directories
RUN mkdir -p data logs backups && \
    chown -R roblox:nodejs /app

# Switch to non-root user
USER roblox

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "start"]