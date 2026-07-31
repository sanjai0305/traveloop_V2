FROM node:20-alpine

WORKDIR /app/Backend

COPY Backend/package*.json ./

RUN npm ci

COPY Backend/ ./

EXPOSE 5000

CMD ["npm", "start"]
