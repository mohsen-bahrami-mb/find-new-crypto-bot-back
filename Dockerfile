FROM node:20-alpine3.20

# ENV NODE_VERSION 22.14.0

RUN addgroup backendApp && adduser -S -G backendApp backendApp 
WORKDIR /backendApp
RUN chown -R backendApp:backendApp /backendApp

USER backendApp

# COPY ./browser-user-data .
COPY package.json .

RUN npm i -f
COPY . .
RUN npm run build

EXPOSE 4000 4001

CMD ["npm", "run", "start:prod"]