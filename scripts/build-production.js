
#!/usr/bin/env node

// Production build script for Tecace Device Management System
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Tecace DMS Production Build...');

// Ensure we're using production environment
process.env.NODE_ENV = 'production';

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

// Start build process
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('📦 Building frontend for production...');
console.log('[BUILD] Using NODE_ENV=production');

const buildProcess = spawn(npmCmd, ['run', 'build'], { 
  cwd: rootDir,
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    FORCE_COLOR: "1" 
  }
});

handleProcess(buildProcess, 'BUILD');

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Production build completed successfully!');
    console.log('🚀 To deploy this build:');
    console.log('  1. Copy the "dist" directory to your production server');
    console.log('  2. Set up your server to serve the static files');
    console.log('  3. Configure the backend server with NODE_ENV=production');
    console.log('  4. Start the backend with: cd server && node server.js');
    
    // Update the version information to indicate this is a production build
    try {
      const versionPath = path.join(rootDir, 'src/constants/version.ts');
      if (fs.existsSync(versionPath)) {
        console.log('📝 Updating version information for production...');
        const versionContent = fs.readFileSync(versionPath, 'utf8');
        const updatedContent = versionContent.replace(/export const APP_VERSION = '(.+?)';/, 
          (match, version) => `export const APP_VERSION = '${version}';
// Build information
export const BUILD_TYPE = 'production';
export const BUILD_DATE = '${new Date().toISOString()}';`);
        
        fs.writeFileSync(versionPath, updatedContent);
        console.log('✅ Version information updated successfully');
      }
    } catch (error) {
      console.error('⚠️ Failed to update version information:', error.message);
    }
  } else {
    console.error('❌ Production build failed with code', code);
    console.error('Please check the error messages above and fix any issues.');
  }
});
