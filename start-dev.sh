#!/bin/bash
while true; do
  npx next dev -p 3000
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
