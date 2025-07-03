#!/bin/bash

# Nmap MCP Server - Rebuild and Restart Script
# This script stops the existing container, rebuilds the image, and starts a new container

set -e  # Exit on any error

CONTAINER_NAME="nmap-mcp-container"
IMAGE_NAME="nmap-mcp-server"
PORT="5001"

echo "🔄 Starting rebuild process for $IMAGE_NAME..."

# Step 1: Stop and remove existing container (if it exists)
echo "📦 Stopping and removing existing container..."
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo "   - Stopping container: $CONTAINER_NAME"
    docker stop $CONTAINER_NAME
fi

if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
    echo "   - Removing container: $CONTAINER_NAME"
    docker rm $CONTAINER_NAME
fi

# Step 2: Build the new image
echo "🏗️  Building Docker image: $IMAGE_NAME"
docker build -t $IMAGE_NAME .

# Step 3: Start the new container
echo "🚀 Starting new container..."
docker run -p $PORT:$PORT \
    --cap-add=NET_ADMIN \
    --cap-add=NET_RAW \
    --name $CONTAINER_NAME \
    $IMAGE_NAME

echo "✅ Rebuild complete! Container is running on port $PORT"
echo "🔗 Test with: curl -X POST http://localhost:$PORT/mcp -H \"Content-Type: application/json\" -d '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"getInfo\", \"arguments\": {}}}'"
