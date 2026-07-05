#!/bin/sh

set -e

echo "Generating runtime environment..."

envsubst < /opt/config/env.template.js > /usr/share/nginx/html/env.js

echo "Runtime environment generated."

exec nginx -g "daemon off;"