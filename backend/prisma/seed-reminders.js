const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USER_EMAIL = 'kontakt@example.com';

const REMINDER_TYPES = ['VYMENA_OLEJE', 'STK', 'EMISE', 'POJISTENI', 'VYMENA_PNEUMATIK', 'VLASTNI'];

const CUSTOM_TITLES = [
  'Zkontrolovat brzdové destičky',
  'Objednat zimní pneumatiky',
  'Vyzvednout doklady od pojišťovny',
  'Umýt auto před prodejem',
  'Zkontrolovat stav akumulátoru',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function titleForType(type) {
  const labels = {
    VYMENA_OLEJE: 'Výměna oleje',
    STK: 'STK',
    EMISE: 'Emise',
    POJISTENI: 'Pojištění',
    VYMENA_PNEUMATIK: 'Výměna pneumatik',
    VLASTNI: CUSTOM_TITLES[randomInt(0, CUSTOM_TITLES.length - 1)],
  };
  return labels[type];
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });

  if (!user) {
    console.error(`Uživatel s e-mailem ${USER_EMAIL} nenalezen.`);
    process.exit(1);
  }

  const cars = await prisma.car.findMany({ where: { ownerId: user.id } });

  if (cars.length === 0) {
    console.error('Uživatel nemá žádná auta. Nejdřív spusť seed-test-data.js.');
    process.exit(1);
  }

  console.log(`Generuji připomínky pro ${cars.length} aut uživatele ${user.email}`);

  // Rozložení termínů: pár po termínu, pár brzy, pár daleko v budoucnu, pár na nájezd
  const dueDateOffsets = [-15, -3, 5, 12, 25, 45, 90, 180, 365];

  for (const car of cars) {
    const numReminders = randomInt(3, 6);
    const usedTypes = new Set();

    for (let i = 0; i < numReminders; i++) {
      let type = REMINDER_TYPES[randomInt(0, REMINDER_TYPES.length - 1)];
      // Snažíme se u jednoho auta neopakovat stejný typ (kromě VLASTNI, které může být víckrát)
      let attempts = 0;
      while (usedTypes.has(type) && type !== 'VLASTNI' && attempts < 5) {
        type = REMINDER_TYPES[randomInt(0, REMINDER_TYPES.length - 1)];
        attempts++;
      }
      usedTypes.add(type);

      const useMileage = Math.random() > 0.7; // ~30 % připomínek podle nájezdu místo data
      const offset = dueDateOffsets[randomInt(0, dueDateOffsets.length - 1)];
      const completed = offset < -10 ? Math.random() > 0.5 : false; // část starých je už splněná

      await prisma.reminder.create({
        data: {
          type,
          title: titleForType(type),
          notes: Math.random() > 0.6 ? `Automaticky vygenerovaná testovací připomínka.` : null,
          dueDate: useMileage ? null : daysFromNow(offset),
          dueMileage: useMileage ? (car.mileage || 30000) + randomInt(500, 5000) : null,
          emailAlert: Math.random() > 0.2,
          completed,
          carId: car.id,
        },
      });
    }

    console.log(`✔ ${car.make} ${car.model}: ${numReminders} připomínek`);
  }

  console.log('\n🎉 Hotovo! Připomínky byly vygenerovány.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });