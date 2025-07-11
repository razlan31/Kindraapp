#!/bin/bash
# Simple build script to ensure production matches preview

echo "Starting build process..."

# Clean old builds
rm -rf dist/

# Build frontend with timeout protection
timeout 120 npm run build 2>&1 | head -100

# Check if build succeeded
if [ -d "dist/" ]; then
  echo "Build completed successfully"
  ls -la dist/
else
  echo "Build failed or timed out"
  exit 1
fi