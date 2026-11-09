const test = require('node:test');
const assert = require('node:assert/strict');
const { Resend } = require('resend');
const { sendVerificationEmail, sendReminderEmail } = require('../utils/email');

test('email errors reject; configured URLs and escaped reminder content are used', async (t) => {
  const original = { key: process.env.RESEND_API_KEY, url: process.env.FRONTEND_URL, from: process.env.EMAIL_FROM };
  t.after(() => {
    for (const [name, value] of Object.entries({ RESEND_API_KEY: original.key, FRONTEND_URL: original.url, EMAIL_FROM: original.from })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  process.env.RESEND_API_KEY = 're_test';
  process.env.FRONTEND_URL = 'https://autoapp.example';
  process.env.EMAIL_FROM = 'AutoApp <mail@autoapp.example>';
  let sent;
  const post = t.mock.method(Resend.prototype, 'post', async (_path, body) => {
    sent = body;
    return { data: null, error: { message: 'Delivery rejected' } };
  });
  await assert.rejects(sendVerificationEmail('test@example.com', 'abc'), /Delivery rejected/);
  assert.match(sent.html, /https:\/\/autoapp.example\/verify-email\?token=abc/);
  assert.equal(sent.from, process.env.EMAIL_FROM);
  post.mock.mockImplementation(async (_path, body) => { sent = body; return { data: { id: 'test' }, error: null }; });
  await sendReminderEmail('test@example.com', [{ title: '<script>', car: { make: 'A&B', model: 'Car' }, dueMileage: 1000 }]);
  assert.match(sent.html, /&lt;script&gt;/);
  assert.match(sent.html, /A&amp;B/);
});
