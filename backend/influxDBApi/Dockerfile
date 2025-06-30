FROM node:alpine

WORKDIR ./

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3060

CMD ["npm", "start"]