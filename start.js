// Custom starter script for Tecace Device Management System
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Tecace Device Management System...');
console.log('ℹ️  You can run this script with: node start.js');

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
};

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
    if (code !== 0) {
      console.error(`[${name}] Process terminated abnormally with code ${code}`);
      console.error(`[${name}] This might be causing the connection refused errors.`);
      
      if (name === 'FRONTEND') {
        console.log('📌 Troubleshooting suggestions:');
        console.log('   1. Check if another application is using port 8080');
        console.log('   2. Try running "npm run dev" directly to see detailed errors');
        console.log('   3. Check your vite.config.ts for any configuration issues');
      }
    }
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

// Function to determine environment URLs
const getEnvironmentURLs = (isDev) => {
  const port = process.env.PORT || 5000;
  const clientPort = 8080;
  
  return {
    apiUrl: isDev ? `http://localhost:${port}/api` : 'https://dm.tecace.com/api',
    clientUrl: isDev ? `http://localhost:${clientPort}` : 'https://dm.tecace.com'
  };
};

// Start processes with error handling
const startProcess = async (command, args, options, name) => {
  try {
    // If this is the frontend server, check if port 8080 is already in use
    if (name === 'FRONTEND') {
      const portInUse = await isPortInUse(8080);
      if (portInUse) {
        console.error('[FRONTEND] ⚠️ Port 8080 is already in use by another application!');
        console.error('[FRONTEND] Please close the other application or modify vite.config.ts to use a different port.');
        console.error('[FRONTEND] Attempting to start the frontend server anyway...');
      }
    }
    
    console.log(`[${name}] Starting with command: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, options);
    handleProcess(process, name);
    return process;
  } catch (error) {
    console.error(`Failed to start ${name}: ${error.message}`);
    console.error(`Try running ${name} manually instead.`);
    return null;
  }
};

// Check if the .env file exists in the server directory
const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('⚠️ No .env file found in the server directory. Creating one from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from .env.example');
}

// Start the backend server
console.log('📡 Starting backend server...');
console.log('[SERVER] Running in directory:', path.join(__dirname, 'server'));
const serverPath = path.join(__dirname, 'server');
const server = await startProcess('node', ['server.js'], { cwd: serverPath }, 'SERVER');

// Determine the npm executable based on OS
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Start the frontend dev server with the working directory explicitly set to the project root
console.log('🖥️ Starting frontend development server...');
console.log('[FRONTEND] Running in directory:', __dirname);
const frontend = await startProcess(npmCmd, ['run', 'dev'], { 
  cwd: __dirname,
  shell: true, // Use shell to ensure compatibility across platforms
  env: { ...process.env, FORCE_COLOR: "1" } // Enable color output
}, 'FRONTEND');

if (server || frontend) {
  const { apiUrl, clientUrl } = getEnvironmentURLs(process.env.NODE_ENV !== 'production');
  console.log('✅ Started services successfully!');
  console.log('⚠️ Press Ctrl+C to stop all services');
  console.log(`📝 Access the application at: ${clientUrl}`);
  console.log(`📝 Backend API running at: ${apiUrl}`);
  console.log('🔍 If the app shows connection errors, don\'t worry - it will switch to development mode automatically');
  
  // Add troubleshooting instructions
  console.log('\n📌 Troubleshooting connection issues:');
  console.log('   1. Make sure no other application is using port 8080');
  console.log('   2. If using a new terminal, make sure you\'re in the project root directory');
  console.log('   3. Try accessing http://localhost:8080 directly in your browser');
  console.log('   4. If you still see connection refused errors, try starting the services manually:');
  console.log('      - Terminal 1: cd server && node server.js');
  console.log('      - Terminal 2: npm run dev');
} else {
  console.log('⚠️ Failed to start some services. See errors above.');
  const { apiUrl, clientUrl } = getEnvironmentURLs(true);
  console.log('📝 Manual startup instructions:');
  console.log(`   1. Start backend: cd server && node server.js (API will be at ${apiUrl})`);
  console.log(`   2. Start frontend: npm run dev (Client will be at ${clientUrl})`);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('🛑 Stopping all services...');
  if (server) server.kill();
  if (frontend) frontend.kill();
  process.exit(0);
});
