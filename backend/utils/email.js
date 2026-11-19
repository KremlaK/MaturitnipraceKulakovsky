const { Resend } = require('resend');

async function sendEmail(message) {
  // Bez Resend klíče se při vývoji e-mail jen vypíše do konzole (odkazy jdou zkopírovat).
  // V produkci je klíč povinný – chybějící klíč je chyba.
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY není nastavený.');
    console.log(`\n[e-mail – vývojový režim] Komu: ${message.to}\nPředmět: ${message.subject}\n${message.text || message.html}\n`);
    return;
  }
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
    text: `Ověř svůj e-mail: ${verifyUrl}`,
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
    text: `Obnov si heslo: ${resetUrl}`,
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
    subject: 'Blížící se připomínky - AutoApp',
    html: `
      <h2>Máš blížící se připomínky</h2>
      <ul>${itemsHtml}</ul>
      <p>Přihlas se do AutoApp pro víc detailů.</p>
    `,
  });
}

async function sendBugReportEmail(toEmail, report) {
  await sendEmail({
    to: toEmail,
    subject: `Nová chyba: ${report.title.slice(0, 80)} - AutoApp`,
    text: `${report.title}\n\n${report.description}\n\nStránka: ${report.pageUrl || '—'}`,
    html: `
      <h2>${escapeHtml(report.title)}</h2>
      <p style="white-space:pre-wrap">${escapeHtml(report.description)}</p>
      <p>Stránka: ${escapeHtml(report.pageUrl || '—')}<br>Prohlížeč: ${escapeHtml(report.userAgent || '—')}</p>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendReminderEmail, sendBugReportEmail };