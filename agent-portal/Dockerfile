FROM node:20-alpine

WORKDIR /app

COPY project-resources ./project-resources
COPY agent-portal/package*.json ./agent-portal/

WORKDIR /app/agent-portal
RUN npm ci

COPY agent-portal/ ./

EXPOSE 5182

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
