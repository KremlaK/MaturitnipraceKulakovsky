const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Zadej svůj e-mail, pod kterým jsi zaregistrovaný
const USER_EMAIL = 'kontakt@example.com';

const CAR_TEMPLATES = [
  { make: 'Volkswagen', model: 'Golf', year: 2019, licensePlate: '2CD3456', startMileage: 62000 },
  { make: 'Toyota', model: 'Corolla', year: 2021, licensePlate: '3EF6789', startMileage: 28000 },
  { make: 'BMW', model: 'Řada 3', year: 2018, licensePlate: '4GH9012', startMileage: 89000 },
  { make: 'Hyundai', model: 'i30', year: 2022, licensePlate: '5IJ3456', startMileage: 15000 },
];

const SERVICE_TYPES = ['Výměna oleje', 'Brzdy', 'Filtry', 'Klimatizace', 'STK', 'Pneumatiky', 'Baterie'];
const EXPENSE_CATEGORIES = ['PNEUMATIKY', 'POJISTENI', 'STK', 'PARKOVANI', 'DALNICNI_ZNAMKA', 'MYCKA'];
const FUEL_TYPES = ['Natural 95', 'Nafta'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });

  if (!user) {
    console.error(`Uživatel s e-mailem ${USER_EMAIL} nenalezen. Uprav proměnnou USER_EMAIL ve skriptu.`);
    process.exit(1);
  }

  console.log(`Generuji testovací data pro uživatele: ${user.email}`);

  for (const template of CAR_TEMPLATES) {
    const fuelType = template.make === 'BMW' || template.make === 'Volkswagen' ? 'Nafta' : 'Natural 95';

    const car = await prisma.car.create({
      data: {
        make: template.make,
        model: template.model,
        year: template.year,
        licensePlate: template.licensePlate,
        mileage: template.startMileage,
        ownerId: user.id,
      },
    });

    console.log(`✔ Vytvořeno auto: ${car.make} ${car.model}`);

    // --- Tankování: 10 záznamů za posledních ~9 měsíců, mileage postupně roste ---
    let mileage = template.startMileage - randomInt(4000, 6000);
    const numFuelRecords = randomInt(8, 12);

    for (let i = 0; i < numFuelRecords; i++) {
      mileage += randomInt(350, 650);
      const liters = randomFloat(30, 55);
      const pricePerLiter = randomFloat(36, 41);
      const daysBack = (numFuelRecords - i) * 24 + randomInt(-3, 3);

      await prisma.fuelRecord.create({
        data: {
          date: daysAgo(daysBack),
          liters,
          pricePerLiter,
          totalPrice: Math.round(liters * pricePerLiter * 100) / 100,
          mileage,
          fuelType,
          fullTank: Math.random() > 0.15, // většinou do plna
          carId: car.id,
        },
      });
    }

    // Aktualizuj finální nájezd auta na poslední hodnotu z tankování
    await prisma.car.update({ where: { id: car.id }, data: { mileage } });

    // --- Servisní záznamy: 3-6 záznamů ---
    const numServiceRecords = randomInt(3, 6);
    for (let i = 0; i < numServiceRecords; i++) {
      const type = SERVICE_TYPES[randomInt(0, SERVICE_TYPES.length - 1)];
      await prisma.serviceRecord.create({
        data: {
          type,
          price: randomInt(500, 12000),
          date: daysAgo(randomInt(10, 280)),
          mileage: randomInt(template.startMileage - 4000, template.startMileage + 1000),
          description: `Automaticky vygenerovaný testovací záznam: ${type}`,
          carId: car.id,
        },
      });
    }

    // --- Výdaje: 3-7 záznamů ---
    const numExpenses = randomInt(3, 7);
    for (let i = 0; i < numExpenses; i++) {
      const category = EXPENSE_CATEGORIES[randomInt(0, EXPENSE_CATEGORIES.length - 1)];
      await prisma.expense.create({
        data: {
          category,
          price: randomInt(300, 9000),
          date: daysAgo(randomInt(10, 300)),
          description: `Testovací výdaj - ${category}`,
          carId: car.id,
        },
      });
    }

    console.log(`  → ${numFuelRecords} tankování, ${numServiceRecords} servisů, ${numExpenses} výdajů`);
  }

  console.log('\n🎉 Hotovo! Testovací data byla vygenerována.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });