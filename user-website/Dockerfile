FROM node:20-alpine

WORKDIR /app

COPY project-resources ./project-resources
COPY user-website/package*.json ./user-website/

WORKDIR /app/user-website
RUN npm ci

COPY user-website/ ./

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
