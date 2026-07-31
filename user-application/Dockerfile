FROM node:20-alpine

WORKDIR /app

# Copy shared project resources
COPY project-resources ./project-resources

# Copy package files first for Docker layer caching
COPY user-application/package*.json ./user-application/

WORKDIR /app/user-application

# Install dependencies
# legacy-peer-deps required because capacitor-google-auth expects Capacitor v5
# while the application currently uses Capacitor v7
RUN npm ci --legacy-peer-deps

# Copy application source
COPY user-application/ ./

EXPOSE 5173

# Make Vite accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]