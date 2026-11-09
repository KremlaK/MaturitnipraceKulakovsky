const test = require('node:test');
const assert = require('node:assert/strict');
const { fuelConsumption } = require('../utils/fuelConsumption');
const fill = (mileage, liters, fullTank = true) => ({ mileage, liters, fullTank, date: '2026-09-01' });

test('includes partial fills between full tanks and ignores unfinished intervals', () => {
  const result = fuelConsumption([fill(1500, 30), fill(1000, 50), fill(1200, 20, false), fill(1700, 10, false)]);
  assert.equal(result.averageConsumption, 10);
  assert.deepEqual(result.trend, [{ date: '2026-09-01', consumption: 10 }]);
});
test('requires a completed full-tank interval', () => {
  for (const records of [[], [fill(1000, 50)], [fill(500, 20, false), fill(1000, 50), fill(1200, 20, false)]]) {
    assert.equal(fuelConsumption(records).averageConsumption, null);
  }
});
test('weights intervals by distance rather than averaging their consumption', () => {
  assert.equal(fuelConsumption([fill(0, 50), fill(100, 10), fill(1000, 45)]).averageConsumption, 5.5);
});
test('retains fuel added at the same odometer reading', () => {
  assert.equal(fuelConsumption([fill(1000, 40), fill(1000, 10), fill(1500, 30)]).averageConsumption, 8);
});
