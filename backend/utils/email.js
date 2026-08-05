const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `http://localhost:5173/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Ověř svůj e-mail - AutoApp',
    html: `
      <h2>Vítej v AutoApp!</h2>
      <p>Pro ověření svého e-mailu klikni na odkaz níže:</p>
      <a href="${verifyUrl}">Ověřit e-mail</a>
      <p>Odkaz je platný 24 hodin.</p>
    `,
  });
}

async function sendPasswordResetEmail(toEmail, token) {
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Obnovení hesla - AutoApp',
    html: `
      <h2>Žádost o obnovení hesla</h2>
      <p>Klikni na odkaz níže pro nastavení nového hesla:</p>
      <a href="${resetUrl}">Obnovit heslo</a>
      <p>Pokud jsi o obnovení hesla nežádal, tento e-mail ignoruj.</p>
      <p>Odkaz je platný 1 hodinu.</p>
    `,
  });
}

async function sendReminderEmail(toEmail, reminders) {
  const itemsHtml = reminders.map((r) => {
    const carName = `${r.car.make} ${r.car.model}`;
    const dueInfo = r.dueDate
      ? `Termín: ${new Date(r.dueDate).toLocaleDateString('cs-CZ')}`
      : `Při nájezdu: ${r.dueMileage?.toLocaleString('cs-CZ')} km`;
    return `<li><strong>${r.title}</strong> (${carName}) — ${dueInfo}</li>`;
  }).join('');

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: `⏰ Blížící se připomínky - AutoApp`,
    html: `
      <h2>Máš blížící se připomínky</h2>
      <ul>${itemsHtml}</ul>
      <p>Přihlas se do AutoApp pro víc detailů.</p>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendReminderEmail };