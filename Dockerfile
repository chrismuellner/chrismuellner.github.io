FROM node:21-alpine

WORKDIR /app

COPY postcss.config.js ./
COPY .eleventy.js ./
COPY package*.json ./

RUN npm install

COPY src ./src

EXPOSE 8080

CMD [ "npm", "start"]