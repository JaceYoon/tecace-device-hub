
export const APP_VERSION = '0.2';
export const VERSION = APP_VERSION;

// Build information - will be updated during production build
export const BUILD_TYPE = process.env.NODE_ENV || 'development';
export const BUILD_DATE = '';

// Log version in development mode
if (process.env.NODE_ENV === 'development') {
  console.log(`Running Tecace DMS version ${VERSION} in ${BUILD_TYPE} mode`);
}
