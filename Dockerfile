FROM node:lts-alpine as builder

WORKDIR /usr/src/app

COPY package*.json ./

COPY .npmrc ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine

RUN apk add --no-cache \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install \
        awscli \
    && rm -rf /var/cache/apk/*

RUN aws --versio

WORKDIR /usr/app
RUN chown node .

# never run your apps as root
USER node

COPY package*.json ./
COPY .npmrc ./
# Only install runtime dependencies, this command alone makes the image size much smaller
RUN npm ci

COPY --chown=node --from=builder /usr/src/app/dist .
ADD --chown=node entrypoint.sh .
RUN chmod +x entrypoint.sh

# sequlizerc main file uses config.ts to load configuration,
# but there is no TypeScript in the final image, so we need to
# reference the compiled version of config.ts which is config.js
ADD --chown=node .sequelizerc-prod .sequelizerc
# nest build command doesn't copy migrations files into dist folder,
# we need to copy them manually
ADD --chown=node src/db/migrations src/db/migrations
RUN rm src/db/migrations/*.d.ts

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT [ "/usr/app/entrypoint.sh" ]
CMD [ "node", "src/main.js" ]
