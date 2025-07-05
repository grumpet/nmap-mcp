# Nmap MCP Server - Curl Test Examples

## Basic Scan with XML Output (Default)
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com"}}}'
```

## Scan with Normal (Human-Readable) Output
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com","outputFormat":"normal"}}}'
```

## Scan with Grepable Output
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com","outputFormat":"grepable"}}}'
```

## Service Version Detection with Normal Output
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com","flags":"-sV","outputFormat":"normal"}}}'
```

## Fast Scan with Top 100 Ports
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com","flags":"-F","outputFormat":"normal"}}}'
```

## Aggressive Scan with XML Output
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com","flags":"-A","outputFormat":"xml"}}}'
```

## Scan Specific Ports with Normal Output
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"google.com","flags":"-p 80,443,8080","outputFormat":"normal"}}}'
```

## IP Address Scan with Grepable Output
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nmapScan","arguments":{"target":"8.8.8.8","flags":"-T4 -p 1-1000","outputFormat":"grepable"}}}'
```

## Get Server Info
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"getInfo","arguments":{}}}'
```

## List Available Tools
```bash
curl -X POST http://localhost:5001/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```
