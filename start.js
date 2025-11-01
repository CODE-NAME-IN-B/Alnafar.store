#!/usr/bin/env node

// Production startup script for Railway/Heroku deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Alnafar Game Store...');
console.log('📦 Environment:', process.env.NODE_ENV || 'development');

// Set production environment if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Start the backend server
const serverPath = path.join(__dirname, 'backend', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});
