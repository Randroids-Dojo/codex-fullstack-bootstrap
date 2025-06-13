#!/usr/bin/env bash
set -euo pipefail
cd frontend
# build image
docker build -t frontend-test .
# run container to list node_modules
docker run --rm frontend-test bash -lc 'ls -1 node_modules | grep esbuild && ls -1 node_modules/@esbuild | head'
