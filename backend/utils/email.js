const { Resend } = require('resend');

async function sendEmail(message) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    ...message,
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  });
  if (error) throw new Error(error.message || 'Odesílání e-mailu selhalo.');
}

function frontendLink(path, token) {
  const url = new URL(path, process.env.FRONTEND_URL || 'http://localhost:5173');
  url.searchParams.set('token', token);
  return url.toString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = frontendLink('/verify-email', token);

  await sendEmail({
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
  const resetUrl = frontendLink('/reset-password', token);

  await sendEmail({
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
    return `<li><strong>${escapeHtml(r.title)}</strong> (${escapeHtml(carName)}) — ${dueInfo}</li>`;
  }).join('');

  await sendEmail({
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