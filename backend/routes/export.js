const express = require('express');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

function safeFilename(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');
}

// GET /api/cars/:carId/export/pdf - servisní knížka jako PDF
router.get('/:carId/export/pdf', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const serviceRecords = await prisma.serviceRecord.findMany({
      where: { carId: req.params.carId },
      orderBy: { date: 'asc' },
    });

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Regular', path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf'));
    doc.registerFont('Bold', path.join(__dirname, '..', 'fonts', 'DejaVuSans-Bold.ttf'));
    doc.font('Regular');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="servisni-knizka-${safeFilename(car.make)}-${safeFilename(car.model)}.pdf"`
    );

    doc.pipe(res);

    doc.font('Bold').fontSize(20).text('Servisní knížka', { align: 'center' });
    doc.moveDown();
    doc.font('Regular').fontSize(14).text(`${car.make} ${car.model}`, { align: 'center' });
    doc.fontSize(10).fillColor('#666666').text(
      `${car.year ? `Rok: ${car.year}  ` : ''}${car.licensePlate ? `SPZ: ${car.licensePlate}  ` : ''}${car.vin ? `VIN: ${car.vin}` : ''}`,
      { align: 'center' }
    );
    doc.moveDown(2);
    doc.fillColor('#000000');

    if (serviceRecords.length === 0) {
      doc.fontSize(12).text('Zatím nejsou žádné servisní záznamy.');
    } else {
      serviceRecords.forEach((record, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(12).fillColor('#000000').font('Bold').text(
          `${index + 1}. ${record.type}`,
        );
        doc.font('Regular').fontSize(10).fillColor('#444444');
        doc.text(`Datum: ${new Date(record.date).toLocaleDateString('cs-CZ')}`);
        if (record.mileage) doc.text(`Stav tachometru: ${record.mileage.toLocaleString('cs-CZ')} km`);
        if (record.price) doc.text(`Cena: ${record.price.toLocaleString('cs-CZ')} Kč`);
        if (record.description) doc.text(`Poznámka: ${record.description}`);

        doc.moveDown();
        doc.strokeColor('#dddddd').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();
      });

      const total = serviceRecords.reduce((sum, r) => sum + (r.price || 0), 0);
      doc.fontSize(12).font('Bold').fillColor('#000000').text(
        `Celkové náklady na servis: ${total.toLocaleString('cs-CZ')} Kč`,
      );
    }

    doc.font('Regular').fontSize(8).fillColor('#999999').text(
      `Vygenerováno v AutoApp dne ${new Date().toLocaleDateString('cs-CZ')}`,
      50, 780, { align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export selhal.' });
  }
});

// GET /api/cars/:carId/export/excel - výdaje jako Excel
router.get('/:carId/export/excel', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const [serviceRecords, fuelRecords, expenses] = await Promise.all([
      prisma.serviceRecord.findMany({ where: { carId: req.params.carId }, orderBy: { date: 'asc' } }),
      prisma.fuelRecord.findMany({ where: { carId: req.params.carId }, orderBy: { date: 'asc' } }),
      prisma.expense.findMany({ where: { carId: req.params.carId }, orderBy: { date: 'asc' } }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AutoApp';

    const serviceSheet = workbook.addWorksheet('Servis');
    serviceSheet.columns = [
      { header: 'Datum', key: 'date', width: 15 },
      { header: 'Typ', key: 'type', width: 25 },
      { header: 'Cena (Kč)', key: 'price', width: 15 },
      { header: 'Nájezd (km)', key: 'mileage', width: 15 },
      { header: 'Poznámka', key: 'description', width: 40 },
    ];
    serviceSheet.getRow(1).font = { bold: true };
    serviceRecords.forEach((r) => {
      serviceSheet.addRow({
        date: new Date(r.date).toLocaleDateString('cs-CZ'),
        type: r.type,
        price: r.price || 0,
        mileage: r.mileage || '',
        description: r.description || '',
      });
    });

    const fuelSheet = workbook.addWorksheet('Tankování');
    fuelSheet.columns = [
      { header: 'Datum', key: 'date', width: 15 },
      { header: 'Typ paliva', key: 'fuelType', width: 15 },
      { header: 'Litry', key: 'liters', width: 10 },
      { header: 'Kč/l', key: 'pricePerLiter', width: 10 },
      { header: 'Celkem (Kč)', key: 'totalPrice', width: 15 },
      { header: 'Nájezd (km)', key: 'mileage', width: 15 },
    ];
    fuelSheet.getRow(1).font = { bold: true };
    fuelRecords.forEach((r) => {
      fuelSheet.addRow({
        date: new Date(r.date).toLocaleDateString('cs-CZ'),
        fuelType: r.fuelType,
        liters: r.liters,
        pricePerLiter: r.pricePerLiter,
        totalPrice: r.totalPrice,
        mileage: r.mileage,
      });
    });

    const expenseSheet = workbook.addWorksheet('Výdaje');
    expenseSheet.columns = [
      { header: 'Datum', key: 'date', width: 15 },
      { header: 'Kategorie', key: 'category', width: 20 },
      { header: 'Cena (Kč)', key: 'price', width: 15 },
      { header: 'Poznámka', key: 'description', width: 40 },
    ];
    expenseSheet.getRow(1).font = { bold: true };
    expenses.forEach((e) => {
      expenseSheet.addRow({
        date: new Date(e.date).toLocaleDateString('cs-CZ'),
        category: e.category,
        price: e.price,
        description: e.description || '',
      });
    });

    const summarySheet = workbook.addWorksheet('Souhrn');
    summarySheet.columns = [
      { header: 'Kategorie', key: 'category', width: 25 },
      { header: 'Celkem (Kč)', key: 'total', width: 15 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    const totalService = serviceRecords.reduce((sum, r) => sum + (r.price || 0), 0);
    const totalFuel = fuelRecords.reduce((sum, r) => sum + r.totalPrice, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.price, 0);
    summarySheet.addRow({ category: 'Servis', total: totalService });
    summarySheet.addRow({ category: 'Palivo', total: totalFuel });
    summarySheet.addRow({ category: 'Výdaje', total: totalExpenses });
    summarySheet.addRow({ category: 'CELKEM', total: totalService + totalFuel + totalExpenses }).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="naklady-${safeFilename(car.make)}-${safeFilename(car.model)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export selhal.' });
  }
});

module.exports = router;