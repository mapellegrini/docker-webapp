#!/bin/sh
set -e
export POSTGRES_USER="$(jq -r '.database.username' /configuration.json)"
export POSTGRES_PASSWORD="$(jq -r '.database.password' /configuration.json)"
if [ -z "$POSTGRES_USER" ] || [ "$POSTGRES_USER" = "null" ]; then
  echo "configuration.json: missing database.username" >&2
  exit 1
fi
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "null" ]; then
  echo "configuration.json: missing database.password" >&2
  exit 1
fi
exec /usr/local/bin/docker-entrypoint.sh "$@"
