FROM node:15
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod -R 765 /usr/src/app
CMD [ "npm", "start" ]
