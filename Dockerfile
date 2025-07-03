FROM ubuntu:22.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies including nmap
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    ca-certificates \
    apt-transport-https \
    nmap \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Verify nmap installation and NSE scripts
RUN nmap --version && \
    ls -la /usr/share/nmap/ && \
    ls -la /usr/share/nmap/scripts/ | head -20

# Set environment variable for nmap directory
ENV NMAPDIR=/usr/share/nmap

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Add a health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD pgrep -f "node.*server.js" || exit 1

# Run the application
CMD [ "node", "server.js" ]
