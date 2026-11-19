const prisma = require('../prisma/client');
const { sendReminderEmail } = require('../utils/email');

const DAYS_BEFORE_ALERT = 14; // upozorni 14 dní předem
const KM_BEFORE_ALERT = 1000; // nebo 1000 km předem
const RENOTIFY_AFTER_DAYS = 7; // pokud už jsme upozornili, znovu až za 7 dní (aby to nespamovalo denně)

async function checkReminders() {
  console.log(`[${new Date().toISOString()}] Kontroluji blížící se připomínky...`);

  const now = new Date();
  const alertDateThreshold = new Date(now.getTime() + DAYS_BEFORE_ALERT * 24 * 60 * 60 * 1000);
  const renotifyThreshold = new Date(now.getTime() - RENOTIFY_AFTER_DAYS * 24 * 60 * 60 * 1000);

  // Najdi všechny nesplněné připomínky s aktivním e-mail alertem,
  // kde termín je blízko (podle data), a buď ještě nebyly nikdy odeslané, nebo je to už dávno
  const reminders = await prisma.reminder.findMany({
    where: {
      completed: false,
      emailAlert: true,
      // jen ověřené adresy – překlep při registraci nesmí posílat upozornění cizím lidem
      car: { owner: { emailVerified: true } },
      dueDate: { lte: alertDateThreshold },
      OR: [
        { notifiedAt: null },
        { notifiedAt: { lt: renotifyThreshold } },
      ],
    },
    include: {
      car: {
        include: { owner: true },
      },
    },
  });

  // Připomínky podle nájezdu musíme filtrovat ručně (porovnání s aktuálním mileage auta)
  const mileageReminders = await prisma.reminder.findMany({
    where: {
      completed: false,
      emailAlert: true,
      // jen ověřené adresy – překlep při registraci nesmí posílat upozornění cizím lidem
      car: { owner: { emailVerified: true } },
      dueMileage: { not: null },
      OR: [
        { notifiedAt: null },
        { notifiedAt: { lt: renotifyThreshold } },
      ],
    },
    include: {
      car: {
        include: { owner: true },
      },
    },
  });

  const relevantMileageReminders = mileageReminders.filter((r) => {
    const carMileage = r.car.mileage || 0;
    return r.dueMileage !== null && r.dueMileage - carMileage <= KM_BEFORE_ALERT;
  });

  // Spojíme oba seznamy a odstraníme duplicity (kdyby měla připomínka náhodou obojí)
  const allReminders = [...reminders, ...relevantMileageReminders];
  const uniqueReminders = Array.from(new Map(allReminders.map((r) => [r.id, r])).values());

  if (uniqueReminders.length === 0) {
    console.log('Žádné připomínky k odeslání.');
    return;
  }

  // Seskup podle uživatele (jeden e-mail může obsahovat víc připomínek najednou)
  const byUser = new Map();
  for (const reminder of uniqueReminders) {
    const userId = reminder.car.owner.id;
    if (!byUser.has(userId)) {
      byUser.set(userId, { user: reminder.car.owner, reminders: [] });
    }
    byUser.get(userId).reminders.push(reminder);
  }

  for (const { user, reminders: userReminders } of byUser.values()) {
    try {
      await sendReminderEmail(user.email, userReminders);
      console.log(`Odeslán e-mail uživateli ${user.email} (${userReminders.length} připomínek)`);

      // Označ jako odeslané
      await prisma.reminder.updateMany({
        where: { id: { in: userReminders.map((r) => r.id) } },
        data: { notifiedAt: now },
      });
    } catch (error) {
      console.error(`Chyba při odesílání e-mailu uživateli ${user.email}:`, error);
    }
  }
}

module.exports = { checkReminders };