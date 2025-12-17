#!/usr/bin/env bash
set -e

cd /srv/crypto-sockets

git pull --rebase
docker compose down
docker compose up -d --build
