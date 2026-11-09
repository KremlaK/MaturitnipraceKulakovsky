// A full tank establishes the starting point. Every subsequent fill contributes
// to consumption until the next full tank closes the measured interval.
function fuelConsumption(records) {
  const sorted = [...records].sort((a, b) => a.mileage - b.mileage);
  let previousFull = null;
  let pendingLiters = 0;
  let totalLiters = 0;
  let totalKm = 0;
  const trend = [];

  for (const record of sorted) {
    if (!previousFull) {
      if (record.fullTank) previousFull = record;
      continue;
    }
    pendingLiters += record.liters;
    if (!record.fullTank) continue;

    const km = record.mileage - previousFull.mileage;
    if (km > 0) {
      totalLiters += pendingLiters;
      totalKm += km;
      trend.push({
        date: new Date(record.date).toISOString().slice(0, 10),
        consumption: Math.round(pendingLiters / km * 10000) / 100,
      });
      pendingLiters = 0;
      previousFull = record;
    }
  }

  return {
    averageConsumption: totalKm > 0 ? Math.round(totalLiters / totalKm * 10000) / 100 : null,
    trend,
  };
}

module.exports = { fuelConsumption };
