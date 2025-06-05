
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('devices', 'memo', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Memo field for additional device information'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('devices', 'memo');
  }
};
