
# Development and Production Environment Documentation

This document outlines the differences between development and production environments in the Tecace Device Management System, and provides guidance on which files should be excluded from production builds.

## Environment Configuration

The application uses two different environment files:

- `.env.development` - Used for local development
- `.env.production` - Used for production deployment

### Development Environment Settings

```
NODE_ENV=development
API_URL=http://localhost:5000/api
DB_HOST=localhost
CLIENT_URL=http://localhost:8080
FORCE_DEV_MODE=true
```

### Production Environment Settings

```
NODE_ENV=production
API_URL=https://dm.tecace.com/api
DB_HOST=172.20.0.130
CLIENT_URL=https://dm.tecace.com
FORCE_DEV_MODE=false
```

## Files That Should Not Be Included in Production

The following files and directories should be excluded from production builds:

1. **Development-Only Files:**
   - `server/.env.example` - Only needed for development setup
   - `start.js` - Local development starter script
   - `.gitignore` - Only needed for development
   - `README.md` - Development documentation
   - `DEV_PROD_DOCUMENTATION.md` - This file (internal documentation)

2. **Mock/Test Data:**
   - `src/utils/data/mockData.ts` - Only used in development mode
   - `src/utils/data/generateTestData.ts` - Only used for development testing
   - `src/utils/data/deviceStore.ts` - Local storage implementation for development

3. **Development Utilities:**
   - Any files explicitly marked with development-only logic

## Conditional Logging

The application implements conditional logging that only displays sensitive information in development mode:

1. **Credentials Logging:**
   - Login credentials are only logged in development mode
   - Registration information is only logged in development mode
   - API connection details are only logged in development mode

2. **Version Information:**
   - Version is displayed differently in console based on environment:
     - Development: Blue background with "(Development Mode)" text
     - Production: Green background without additional text

## API Service Implementation

The API services have been updated to handle both development and production environments:

1. In development mode:
   - More verbose logging
   - Development server endpoints
   - Mock data fallbacks when server is unavailable

2. In production mode:
   - Minimal logging (no sensitive information)
   - Production server endpoints
   - No mock data, strict API enforcement

## Environment Detection

The application uses `process.env.NODE_ENV` to detect the current environment. This is automatically set by the build process:

- When running with `npm run dev` - development environment is used
- When running with `npm run build` - production environment is used

## Security Considerations

1. **Production Environment:**
   - No sensitive credentials should be logged
   - Error messages should be generic and not expose system details
   - Authentication should be strictly enforced

2. **Development Environment:**
   - More detailed logging is permitted
   - Mock authentication may be used for testing
   - Development-specific routes and endpoints may be enabled

## Build Process

The build process should be configured to:

1. Use the appropriate `.env` file based on the build target
2. Exclude development-only files from production builds
3. Optimize assets for production
4. Apply appropriate security measures for production deployment

## Deployment Recommendations

1. Always build the application using the production environment settings
2. Verify that no sensitive information is exposed in the production build
3. Test the application thoroughly in a staging environment before deploying to production
4. Implement proper server-side security measures (HTTPS, secure headers, etc.)
