#!/bin/bash

# Roblox MCP Node.js Server - Quick Start Script
# Author: MiniMax Agent

set -e

echo "🚀 Roblox MCP Node.js Server - Quick Start"
echo "==========================================="

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION detected. Requires Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p data logs backups
echo -e "${GREEN}✅ Directories created${NC}"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm ci --only=production
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
npm run db:init
echo -e "${GREEN}✅ Database initialized${NC}"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env file with your HMAC secret!${NC}"
fi

# Generate secure HMAC secret
echo -e "${BLUE}Generating secure HMAC secret...${NC}"
if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Generated secure secret: $SECRET${NC}"
    echo -e "${YELLOW}Update your .env file with this secret for production use${NC}"
else
    echo -e "${YELLOW}⚠️  OpenSSL not found. Please generate HMAC secret manually${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update .env file with your HMAC secret"
echo "2. Run 'npm run dev' untuk development"
echo "3. Run 'npm start' untuk production"
echo "4. Test dengan 'node examples/basic-usage.js'"
echo ""
echo -e "${BLUE}Server will start on: http://localhost:3000${NC}"
echo -e "${BLUE}Health check: http://localhost:3000/health${NC}"
echo ""

# Ask user if they want to start server
read -p "🚀 Start the server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Starting server...${NC}"
    npm run dev
fi