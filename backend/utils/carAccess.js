const prisma = require('../prisma/client');

// Vrátí auto, pokud je uživatel majitel NEBO má auto sdílené (jakákoliv role)
async function getAccessibleCar(carId, userId) {
  return prisma.car.findFirst({
    where: {
      id: carId,
      OR: [
        { ownerId: userId },
        { shares: { some: { userId } } },
      ],
    },
  });
}

// Vrátí auto, jen pokud je uživatel PŘÍMO majitel (pro operace jako mazání, sdílení)
async function getOwnedCar(carId, userId) {
  return prisma.car.findFirst({ where: { id: carId, ownerId: userId } });
}

module.exports = { getAccessibleCar, getOwnedCar };