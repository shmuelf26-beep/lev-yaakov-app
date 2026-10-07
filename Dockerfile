# השרת בארגז Docker
FROM node:22-alpine

WORKDIR /app

# העתק את files
COPY package.json package-lock.json ./
RUN npm install --production

COPY server ./server
COPY client ./client
COPY scripts ./scripts
COPY data ./data

# צור data directory אם לא קיים
RUN mkdir -p /app/data

# Port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# התחלה
CMD ["npm", "start"]
