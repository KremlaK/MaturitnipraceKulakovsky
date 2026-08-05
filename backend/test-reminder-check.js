require('dotenv').config();
const { checkReminders } = require('./jobs/reminderCheck');

checkReminders()
  .then(() => {
    console.log('Hotovo.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });