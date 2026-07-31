FROM node:20-alpine

WORKDIR /app

COPY project-resources ./project-resources
COPY admin-portal/package*.json ./admin-portal/

WORKDIR /app/admin-portal
RUN npm ci

COPY admin-portal/ ./

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
