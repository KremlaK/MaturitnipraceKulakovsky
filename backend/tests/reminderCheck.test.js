const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('failed reminder delivery stays eligible for retry; successful delivery is recorded', async () => {
  for (const fails of [true, false]) {
    const updates = [];
    const reminder = {
      id: 'reminder-1', dueMileage: null,
      car: { owner: { id: 'owner-1', email: 'test@example.com' } },
    };
    const prisma = { reminder: {
      findMany: async (query) => query.where.dueDate ? [reminder] : [],
      updateMany: async (query) => { updates.push(query); },
    } };
    const module = { exports: {} };
    let deliveries = 0;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../jobs/reminderCheck.js'), 'utf8'), {
      module,
      require: (name) => {
        if (name === '../prisma/client') return prisma;
        if (name === '../utils/email') return { sendReminderEmail: async () => {
          deliveries++;
          if (fails) throw new Error('Delivery rejected');
        } };
        throw new Error(`Unexpected dependency: ${name}`);
      },
      console: { log() {}, error() {} },
    });
    await module.exports.checkReminders();
    assert.equal(deliveries, 1);
    assert.equal(updates.length, fails ? 0 : 1);
    if (!fails) assert.equal(updates[0].where.id.in[0], reminder.id);
  }
});
