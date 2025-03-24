
// Custom starter script for Tecace Device Management System
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Tecace Device Management System...');
console.log('ℹ️  You can run this script with: node start.js');

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
console.log('📝 Access the application at: http://localhost:8080');

// Handle script termination
process.on('SIGINT', () => {
  console.log('🛑 Stopping all services...');
  server.kill();
  frontend.kill();
  process.exit(0);
});
