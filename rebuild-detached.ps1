# Nmap MCP Server - Rebuild and Restart Script (PowerShell - Detached Mode)
# This script stops the existing container, rebuilds the image, and starts a new container in background

param(
    [string]$ContainerName = "nmap-mcp-container",
    [string]$ImageName = "nmap-mcp-server",
    [string]$Port = "5001"
)

Write-Host "🔄 Starting rebuild process for $ImageName (detached mode)..." -ForegroundColor Cyan

# Step 1: Stop and remove existing container (if it exists)
Write-Host "📦 Stopping and removing existing container..." -ForegroundColor Yellow

$existingContainer = docker ps -q -f name=$ContainerName 2>$null
if ($existingContainer) {
    Write-Host "   - Stopping container: $ContainerName" -ForegroundColor Gray
    docker stop $ContainerName | Out-Null
}

$existingContainer = docker ps -aq -f name=$ContainerName 2>$null
if ($existingContainer) {
    Write-Host "   - Removing container: $ContainerName" -ForegroundColor Gray
    docker rm $ContainerName | Out-Null
}

# Step 2: Build the new image
Write-Host "🏗️  Building Docker image: $ImageName" -ForegroundColor Yellow
docker build -t $ImageName .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Start the new container in detached mode
Write-Host "🚀 Starting new container in background..." -ForegroundColor Yellow
docker run -d -p "${Port}:${Port}" `
    --cap-add=NET_ADMIN `
    --cap-add=NET_RAW `
    --name $ContainerName `
    $ImageName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rebuild complete! Container is running in background on port $Port" -ForegroundColor Green
    Write-Host "📋 Container status:" -ForegroundColor Cyan
    docker ps -f name=$ContainerName
    Write-Host ""
    Write-Host "📜 View logs with: docker logs -f $ContainerName" -ForegroundColor Cyan
    Write-Host "🔗 Test with: curl -X POST http://localhost:$Port/mcp -H `"Content-Type: application/json`" -d '{`"jsonrpc`": `"2.0`", `"id`": 1, `"method`": `"tools/call`", `"params`": {`"name`": `"getInfo`", `"arguments`": {}}}'" -ForegroundColor White
} else {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}
