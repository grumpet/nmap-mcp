import { createStatelessServer } from '@smithery/sdk/server/stateless.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { exec, execSync } from 'child_process';
import { Parser as XmlParser } from 'xml2js';
import { promisify } from 'util';

const xmlParser = new XmlParser({ explicitArray: false, mergeAttrs: true });
const execAsync = promisify(exec);

// Function to find nmap executable
function findNmapPath() {
  try {
    // Try 'which' command, common on Linux/macOS
    const path = execSync('which nmap').toString().trim();
    if (path) {
      console.log(`Found nmap at: ${path}`);
      return path;
    }
  } catch (error) {
    // 'which' might not be available or nmap not in PATH
    console.warn("'which nmap' failed, trying 'where nmap' or default path.");
  }

  try {
    // Try 'where' command, common on Windows, though less likely in Docker
    const path = execSync('where nmap').toString().trim().split('\\n')[0]; // Take the first result if multiple
    if (path) {
      console.log(`Found nmap at: ${path}`);
      return path;
    }
  } catch (error) {
     console.warn("'where nmap' failed, falling back to default path.");
  }
  
  // Fallback to a common default path if not found
  const defaultPath = "/usr/bin/nmap"; // A common path on Linux
  console.log(`Nmap not found via which/where, using default path: ${defaultPath}`);
  return defaultPath;
}

const NMAP_PATH = findNmapPath();

// Input validation and sanitization
function validateTarget(target) {
  // Basic validation for domain names and IP addresses
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  const ipRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
  const cidrRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}\/([0-2]?[0-9]|3[0-2])$/;
  
  return domainRegex.test(target) || ipRegex.test(target) || cidrRegex.test(target);
}

function validateFlags(flags) {
  // Handle undefined/null flags
  if (!flags || typeof flags !== 'string') {
    return false;
  }
  
  // Allow all flags - no whitelist restriction
  // Basic validation to ensure flags are properly formatted
  const flagsArray = flags.split(/\s+/);
  
  for (let i = 0; i < flagsArray.length; i++) {
    const flag = flagsArray[i];
    
    // Skip empty flags
    if (!flag) continue;
    
    // Basic validation: flags should start with - or -- or be values for preceding flags
    if (!flag.startsWith('-') && i === 0) {
      // First flag must start with - or --
      return false;
    }
  }
  
  return true;
}

function createMcpServer({ sessionId, config }) {
  console.log(`[${sessionId || 'N/A'}] Creating MCP server instance`);
  
  const mcpServer = new McpServer({
    name: "NmapService",
    version: "1.0.0",
  });

  // Add the nmap scan tool
  mcpServer.tool(
    "nmapScan",
    {
      target: z.string().describe("Domain name, IP address, or CIDR notation to scan (e.g., example.com, 192.168.1.1, 10.0.0.0/24)"),
      flags: z.string().optional().default("-T4 -p 1-1000").describe("Nmap scanning flags. Common options: -T4 (timing), -p 1-1000 (port range), -sS (SYN scan), -A (aggressive scan)"),
      outputFormat: z.enum(["xml", "normal", "grepable"]).optional().default("xml").describe("Output format: xml (structured), normal (human-readable), or grepable (grep-friendly)")
    },
    async ({ target, flags = "-T4 -p 1-1000", outputFormat = "xml" }) => {
      const logPrefix = `[${sessionId || 'N/A'}]`;
      
      // Debug: Log the received arguments
      console.log(`${logPrefix} Received target: ${target}, flags: ${flags}, outputFormat: ${outputFormat}`);
      
      try {
        console.log(`${logPrefix} Starting Nmap scan for target: ${target}`);
        
        // Validate inputs
        if (!validateTarget(target)) {
          throw new Error(`Invalid target format: ${target}. Use domain names, IP addresses, or CIDR notation.`);
        }
        
        if (!validateFlags(flags)) {
          throw new Error(`Invalid or potentially unsafe flags detected: ${flags}`);
        }

        // Construct output format flag
        let outputFlag;
        switch (outputFormat) {
          case "xml":
            outputFlag = "-oX -";
            break;
          case "normal":
            outputFlag = "-oN -";
            break;
          case "grepable":
            outputFlag = "-oG -";
            break;
          default:
            outputFlag = "-oX -";
        }

        // Construct and execute nmap command with specified output format
        const nmapCommand = `${NMAP_PATH} --datadir /usr/share/nmap ${outputFlag} ${flags} ${target}`;
        console.log(`${logPrefix} Executing command: ${nmapCommand}`);
        
        const { stdout, stderr } = await execAsync(nmapCommand, {
          timeout: 300000, // 5 minute timeout
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        if (stderr) {
          console.warn(`${logPrefix} Nmap stderr: ${stderr}`);
        }

        // Handle output based on format
        if (outputFormat === "xml") {
          // Try to parse XML output, fallback to plain text if it fails
          try {
            const parsedResult = await new Promise((resolve, reject) => {
              xmlParser.parseString(stdout, (parseError, result) => {
                if (parseError) {
                  reject(new Error(`Failed to parse Nmap XML output: ${parseError.message}`));
                } else {
                  resolve(result);
                }
              });
            });

            // Validate parsed result structure
            if (!parsedResult || typeof parsedResult.nmaprun !== 'object') {
              throw new Error("Nmap output parsing did not yield expected nmaprun structure");
            }

            // Format results for better readability
            const summary = formatNmapResults(parsedResult);
            
            console.log(`${logPrefix} Nmap scan completed successfully for ${target}`);

            return {
              content: [
                {
                  type: "text",
                  text: `Nmap Scan Results for ${target} (XML Format)\n\n${summary}\n\nFull XML Output:\n${JSON.stringify(parsedResult, null, 2)}`
                }
              ]
            };

          } catch (parseError) {
            console.warn(`${logPrefix} XML parsing failed, returning raw XML output: ${parseError.message}`);
            
            // Return raw XML output if parsing fails
            return {
              content: [
                {
                  type: "text",
                  text: `Nmap Scan Results for ${target} (Raw XML)\n\n${stdout}`
                }
              ]
            };
          }
        } else {
          // For normal and grepable formats, return plain text
          console.log(`${logPrefix} Nmap scan completed successfully for ${target}`);
          
          return {
            content: [
              {
                type: "text",
                text: `Nmap Scan Results for ${target} (${outputFormat} format)\n\n${stdout}`
              }
            ]
          };
        }

      } catch (error) {
        console.error(`${logPrefix} Nmap scan failed: ${error.message}`);
        
        return {
          content: [
            {
              type: "text", 
              text: `Nmap scan failed for target: ${target}\n\nError: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Add a simple info tool for testing introspection
  mcpServer.tool(
    "getInfo",
    z.object({}),
    async () => {
      return {
        content: [
          {
            type: "text",
            text: `Nmap Service Information:
- Service: Network scanning using Nmap
- Version: 1.0.0
- Available Tools: nmapScan, getInfo
- Session ID: ${sessionId || 'N/A'}`
          }
        ]
      };
    }
  );

  console.log(`${sessionId || 'N/A'} MCP server instance created with tools: nmapScan, getInfo`);
  return mcpServer;
}

// Helper function to format nmap results
function formatNmapResults(parsedResult) {
  try {
    const nmaprun = parsedResult.nmaprun;
    let summary = `Scan started: ${nmaprun.startstr || 'Unknown'}\n`;
    
    if (nmaprun.host) {
      const hosts = Array.isArray(nmaprun.host) ? nmaprun.host : [nmaprun.host];
      
      for (const host of hosts) {
        const address = host.address?.addr || 'Unknown';
        const hostname = host.hostnames?.hostname?.name || '';
        summary += `\nHost: ${address}${hostname ? ` (${hostname})` : ''}\n`;
        summary += `Status: ${host.status?.state || 'Unknown'}\n`;
        
        if (host.ports?.port) {
          const ports = Array.isArray(host.ports.port) ? host.ports.port : [host.ports.port];
          summary += `Open ports:\n`;
          
          for (const port of ports) {
            if (port.state?.state === 'open') {
              summary += `  ${port.portid}/${port.protocol} - ${port.service?.name || 'unknown'}\n`;
            }
          }
        }
      }
    }
    
    summary += `\nScan completed: ${nmaprun.runstats?.finished?.timestr || 'Unknown'}`;
    return summary;
  } catch (error) {
    return "Could not format scan results correctly. Please check the raw output.";
  }
}

// Create and start the server
console.log('Initializing Nmap MCP Server...');

const { app } = createStatelessServer(createMcpServer);
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`MCP Nmap server (Smithery SDK) is running on port ${PORT}`);
  console.log(`Server ready to accept MCP connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});