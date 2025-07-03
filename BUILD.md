# Build Script for Nmap MCP Server Docker Image

## Option 1: Try building with the fixed Kali Linux Dockerfile
```bash
docker build -t nmap-mcp-server .
```

## Option 2: If Kali build fails, use Ubuntu-based Dockerfile
```bash
docker build -f Dockerfile.ubuntu -t nmap-mcp-server .
```

## Option 3: Build with no cache if there are caching issues
```bash
docker build --no-cache -t nmap-mcp-server .
```

## Option 4: Build Ubuntu version with no cache
```bash
docker build --no-cache -f Dockerfile.ubuntu -t nmap-mcp-server .
```

## Running the Container
Once built successfully, run with:
```bash
docker run -d -p 5001:5001 --name nmap-server nmap-mcp-server
```

## Testing the Container
Test that nmap is working inside the container:
```bash
docker exec nmap-server nmap --version
docker exec nmap-server nmap -sn 127.0.0.1
```

## Debugging
If the container fails to start, check logs:
```bash
docker logs nmap-server
```

Run interactively for debugging:
```bash
docker run -it -p 5001:5001 nmap-mcp-server bash
```

## PowerShell Commands (Windows)
```powershell
# Build
docker build -t nmap-mcp-server .

# Run
docker run -d -p 5001:5001 --name nmap-server nmap-mcp-server

# Test
docker exec nmap-server nmap --version

# Logs
docker logs nmap-server

# Clean up
docker stop nmap-server
docker rm nmap-server
```

## Troubleshooting

### If Kali mirrors are slow/broken:
1. Try the Ubuntu-based Dockerfile instead
2. Wait and retry (mirrors sync periodically)
3. Use `--no-cache` flag to force fresh downloads

### If Node.js installation fails:
1. Check NodeSource repository availability
2. Try using the system's Node.js version (though may be older)

### If nmap installation fails:
1. Use Ubuntu base image (more stable package repos)
2. Install specific nmap version if needed
