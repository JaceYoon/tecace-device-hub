
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
  
  process.on('error', (err) => {
    console.error(`[${name}] Failed to start process: ${err.message}`);
    if (err.code === 'ENOENT') {
      console.error(`[${name}] The command was not found. Please ensure that ${name === 'FRONTEND' ? 'npm' : 'node'} is installed and available in your PATH.`);
      if (name === 'FRONTEND') {
        console.error('[FRONTEND] As an alternative, you can run "npm run dev" directly from your terminal.');
      }
    } else if (err.code === 'EINVAL') {
      console.error(`[${name}] Invalid arguments were provided to the process. This might be due to incorrect paths or environment settings.`);
      if (name === 'FRONTEND') {
        console.error('[FRONTEND] Try running "npm run dev" manually in a separate terminal.');
      } else {
        console.error('[SERVER] Try running "cd server && node server.js" manually in a separate terminal.');
      }
    }
  });
};

// Start processes with error handling
const startProcess = (command, args, options, name) => {
  try {
    const process = spawn(command, args, options);
    handleProcess(process, name);
    return process;
  } catch (error) {
    console.error(`Failed to start ${name}: ${error.message}`);
    console.error(`Try running ${name} manually instead.`);
    return null;
  }
};

// Start the backend server
console.log('📡 Starting backend server...');
const serverPath = path.join(__dirname, 'server');
const server = startProcess('node', ['server.js'], { cwd: serverPath }, 'SERVER');

// Determine the npm executable based on OS
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Start the frontend dev server with the working directory explicitly set to the project root
console.log('🖥️ Starting frontend development server...');
const frontend = startProcess(npmCmd, ['run', 'dev'], { 
  cwd: __dirname,
  shell: true, // Use shell to ensure compatibility across platforms
  env: { ...process.env, FORCE_COLOR: "1" } // Enable color output
}, 'FRONTEND');

if (server || frontend) {
  console.log('✅ Started services successfully!');
  console.log('⚠️ Press Ctrl+C to stop all services');
  console.log('📝 Access the application at: http://localhost:8080');
} else {
  console.log('⚠️ Failed to start some services. See errors above.');
  console.log('📝 Manual startup instructions:');
  console.log('   1. Start backend: cd server && node server.js');
  console.log('   2. Start frontend: npm run dev');
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('🛑 Stopping all services...');
  if (server) server.kill();
  if (frontend) frontend.kill();
  process.exit(0);
});
