FROM node:20-alpine

WORKDIR /app

COPY project-resources ./project-resources
COPY user-application/package*.json ./user-application/

WORKDIR /app/user-application
RUN npm ci

COPY user-application/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
