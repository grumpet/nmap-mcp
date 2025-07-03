# Docker Build and cURL Examples for Nmap MCP Server

## Building and Running the Docker Container

### Build the Docker image:
```bash
docker build -t nmap-mcp-server .
```

### Run the container:
```bash
docker run -d -p 5001:5001 --name nmap-server nmap-mcp-server
```

### Run with interactive mode (for debugging):
```bash
docker run -it -p 5001:5001 --name nmap-server nmap-mcp-server
```

### Stop the container:
```bash
docker stop nmap-server
```

### Remove the container:
```bash
docker rm nmap-server
```

## cURL Commands to Interact with the MCP Server

### 1. Health Check (if implemented)
```bash
curl -X GET http://localhost:5001/health
```

### 2. MCP Protocol - List Available Tools
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### 3. Basic Nmap Scan (Quick scan on common ports)
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "nmapScan",
      "arguments": {
        "target": "scanme.nmap.org",
        "flags": "-T4 -p 1-1000"
      }
    }
  }'
```

### 4. Aggressive Scan with Service Detection
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "nmapScan",
      "arguments": {
        "target": "scanme.nmap.org",
        "flags": "-A -T4 -p 22,80,443"
      }
    }
  }'
```

### 5. Vulnerability Scan
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "nmapScan",
      "arguments": {
        "target": "scanme.nmap.org",
        "flags": "--script vuln -p 80,443"
      }
    }
  }'
```

### 6. Scan IP Range (CIDR notation)
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "nmapScan",
      "arguments": {
        "target": "192.168.1.0/24",
        "flags": "-sn"
      }
    }
  }'
```

### 7. Stealth SYN Scan
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "nmapScan",
      "arguments": {
        "target": "scanme.nmap.org",
        "flags": "-sS -T2 -p 1-1000"
      }
    }
  }'
```

### 8. Top Ports Scan
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "nmapScan",
      "arguments": {
        "target": "scanme.nmap.org",
        "flags": "--top-ports 100"
      }
    }
  }'
```

## Docker Compose Example

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  nmap-mcp-server:
    build: .
    ports:
      - "5001:5001"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5001
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:
```bash
docker-compose up -d
```

## PowerShell Examples (Windows)

If you're using PowerShell on Windows, here are equivalent commands:

### Basic scan:
```powershell
$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/call"
    params = @{
        name = "nmapScan"
        arguments = @{
            target = "scanme.nmap.org"
            flags = "-T4 -p 1-1000"
        }
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:5001/mcp" -Method POST -Body $body -ContentType "application/json"
```

## Testing Notes

- Use `scanme.nmap.org` for testing - it's specifically set up for nmap testing
- Be respectful when scanning - don't scan targets you don't own without permission
- The server validates inputs to prevent command injection
- Check Docker logs if something isn't working: `docker logs nmap-server`
- For debugging, run the container interactively: `docker run -it -p 5001:5001 nmap-mcp-server`

## Security Considerations

- This container runs nmap which requires elevated privileges for some scan types
- Consider running with `--cap-drop=ALL --cap-add=NET_RAW --cap-add=NET_ADMIN` for better security
- Always validate scan targets in production environments
- Monitor and limit scan frequency to prevent abuse
