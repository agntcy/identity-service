FROM node:20.18.2-alpine3.21 AS build

# Install packages
RUN apk add --update \
  libpng-dev \
  build-base \
  nodejs \
  npm \
  yarn

# Set workdir
WORKDIR /home/web

# Copy src
COPY ./frontend .

# Install libs
RUN --mount=type=secret,id=ARTIFACTORY_PASSWORD,env=ARTIFACTORY_PASSWORD yarn install
RUN --mount=type=secret,id=ARTIFACTORY_PASSWORD,env=ARTIFACTORY_PASSWORD yarn build


FROM alpine:3.21.0

# Install packages
RUN apk add --update \
  gettext \
  nginx

# Create a group and user
RUN addgroup -S web && adduser -S -G web -u 999 web

# Set workdir
WORKDIR /home/web

COPY --from=build /home/web/dist ./dist
COPY --chown=web:web ./deployments/docker/frontend/nginx/entrypoint.sh .
COPY --chown=web:web ./deployments/docker/frontend/nginx/nginx.conf ./nginx/nginx.env.conf
RUN mkdir ./nginx/logs && \
  mkdir ./nginx/tmp && \
  chown web:web ./nginx/logs && \
  chown web:web ./nginx/tmp

# Add SSI vars
RUN sed -i 's/<head>/<head>\<script nonce="111dd4a0-4c4e-43a9-8eb4-6446ad2e10c7" language="javascript"\>window.apiUrl=`\<!--#echo var="apiUrl"--\>`;window.logLevel=`\<!--#echo var="logLevel"--\>`;window.segmentId=`\<!--#echo var="segmentId"--\>`;window.iamProductId=`\<!--#echo var="iamProductId"--\>`;window.iamUi=`\<!--#echo var="iamUi"--\>`;window.iamApi=`\<!--#echo var="iamApi"--\>`;window.iamOidcClientId=`\<!--#echo var="iamOidcClientId"--\>`;window.iamOidcIssuer=`\<!--#echo var="iamOidcIssuer"--\>`;<\/script>/g' ./dist/index.html

# Set non root user
USER web

ENTRYPOINT ["./entrypoint.sh"]
CMD ["/usr/sbin/nginx", "-c", "/home/web/nginx/nginx.conf", "-g", "daemon off;pid /home/web/nginx/nginx.pid;", "-p", "/home/web/nginx"]
