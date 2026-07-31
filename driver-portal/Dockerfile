FROM node:20-alpine

WORKDIR /app

COPY project-resources ./project-resources
COPY driver-portal/package*.json ./driver-portal/

WORKDIR /app/driver-portal
RUN npm ci

COPY driver-portal/ ./

EXPOSE 5183

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
