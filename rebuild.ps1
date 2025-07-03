# Nmap MCP Server - Rebuild and Restart Script (PowerShell)
# This script stops the existing container, rebuilds the image, and starts a new container

param(
    [string]$ContainerName = "nmap-mcp-container",
    [string]$ImageName = "nmap-mcp-server",
    [string]$Port = "5001"
)

Write-Host "🔄 Starting rebuild process for $ImageName..." -ForegroundColor Cyan

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

# Step 3: Start the new container
Write-Host "🚀 Starting new container..." -ForegroundColor Yellow
docker run -p "${Port}:${Port}" `
    --cap-add=NET_ADMIN `
    --cap-add=NET_RAW `
    --name $ContainerName `
    $ImageName

Write-Host "✅ Rebuild complete! Container is running on port $Port" -ForegroundColor Green
Write-Host "🔗 Test with this command:" -ForegroundColor Cyan
Write-Host "curl -X POST http://localhost:$Port/mcp -H `"Content-Type: application/json`" -d '{`"jsonrpc`": `"2.0`", `"id`": 1, `"method`": `"tools/call`", `"params`": {`"name`": `"getInfo`", `"arguments`": {}}}'" -ForegroundColor White
