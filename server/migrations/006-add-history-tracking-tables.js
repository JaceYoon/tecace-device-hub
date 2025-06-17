
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== MIGRATION 006: SKIPPING HISTORY TRACKING TABLES ===');
    console.log('✅ History tracking tables creation skipped - not in use');
    return;
  },

  down: async (queryInterface, Sequelize) => {
    console.log('=== ROLLING BACK MIGRATION 006: NO TABLES TO REMOVE ===');
    console.log('✅ No history tracking tables to remove');
    return;
  }
};
