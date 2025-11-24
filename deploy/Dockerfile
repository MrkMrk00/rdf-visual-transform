FROM alpine:3.22 AS build

WORKDIR /app

COPY . .

RUN apk add --no-cache \
    nodejs pnpm

RUN pnpm install --frozen-lockfile
RUN pnpm build


FROM nginx:1.29.1-alpine3.22 AS release

COPY --from=build /app/dist /app

COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen       80;
    server_name  _;

    root   /app;
    index  index.html;

    location ~ ^/rdf-visual-transform/(.*) {
        try_files /\$1 =404;
    }

    location / {
        try_files \$uri /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location ~* \.(?:js|css|ttl)$ {
        types {
            text/turtle             ttl;
            application/javascript  js;
            text/css                css;
        }
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

EXPOSE 80
