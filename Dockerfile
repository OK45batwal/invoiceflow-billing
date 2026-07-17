FROM node:20-alpine

WORKDIR /app

# Copy server package manifest and lock file
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the server source code
COPY server/ .

# Expose backend port
ENV PORT=5001
EXPOSE 5001

# Start the server with WebSocket support
CMD ["node", "--experimental-websocket", "server.js"]
