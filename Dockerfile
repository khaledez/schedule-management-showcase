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

RUN cp -R   /usr/src/app/dist .
ADD --chown=node entrypoint.sh .
RUN chmod +x entrypoint.sh


EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT [ "/usr/app/entrypoint.sh" ]
CMD [ "node", "src/main.js" ]
