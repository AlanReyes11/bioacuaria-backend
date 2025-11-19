FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=$PORT

EXPOSE 3000

CMD ["npm", "start"]
