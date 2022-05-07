# syntax=docker/dockerfile:1
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install --production
ENV NODE_ENV production
ENV AUTHOR 'Piotr Tokarski'
ENV EXPRESS_PORT 80
ENTRYPOINT [ "npm" ]
CMD [ "start" ]
