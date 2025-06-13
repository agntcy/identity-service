FROM node:alpine as builder-docs

WORKDIR /build

# Generate docs
COPY docs .
RUN cd /build && npm install --legacy-peer-deps && npx docusaurus generate-proto-docs && npm run build

# Build final image for running the APIs and docs
FROM httpd:2.4

COPY --from=builder-docs /build/build /usr/local/apache2/htdocs
