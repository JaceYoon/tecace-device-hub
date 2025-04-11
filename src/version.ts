
/**
 * Application version information
 * This file tracks the current version of the application
 */

export const VERSION = 'v0.1';
export const APP_NAME = 'Tecace Device Management';

export default {
  VERSION,
  APP_NAME,
  getFullVersion: () => `${APP_NAME} ${VERSION}`
};
