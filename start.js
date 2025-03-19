
// Custom starter script for Tecace Device Management System
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Tecace Device Management System...');

// Function to handle process output
const handleProcess = (process, name) => {
  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });
};

// Start the backend server
console.log('📡 Starting backend server...');
const serverPath = path.join(__dirname, 'server');
const server = spawn('node', ['server.js'], { cwd: serverPath });
handleProcess(server, 'SERVER');

// Start the frontend dev server
console.log('🖥️ Starting frontend development server...');
const frontend = spawn('npm', ['run', 'dev'], { cwd: __dirname });
handleProcess(frontend, 'FRONTEND');

console.log('✅ Both services started successfully!');
console.log('⚠️ Press Ctrl+C to stop both services');

// Handle script termination
process.on('SIGINT', () => {
  console.log('🛑 Stopping all services...');
  server.kill();
  frontend.kill();
  process.exit(0);
});
