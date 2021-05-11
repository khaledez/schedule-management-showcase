FROM node:15
WORKDIR /usr/src/app
COPY package*.json ./
COPY .npmrc ./
RUN npm install
COPY . .
RUN npm run build
RUN chmod -R 765 /usr/src/app
RUN chmod +x /usr/src/app/entrypoint.sh
ENTRYPOINT [ "/usr/app/entrypoint.sh" ]
CMD [ "node", "src/main.js" ]
