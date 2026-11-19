const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Ověří JWT a zároveň, že uživatel pořád existuje a token nebyl zneplatněn
// (po změně nebo obnově hesla se zvýší tokenVersion a staré tokeny přestanou platit).
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chybí autentizační token.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Neplatné nebo vypršelé přihlášení. Přihlas se znovu.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { tokenVersion: true } });
    if (!user || (decoded.tv ?? 0) !== user.tokenVersion) {
      return res.status(401).json({ error: 'Přihlášení už neplatí. Přihlas se znovu.' });
    }
  } catch (error) {
    return next(error);
  }

  req.userId = decoded.userId;
  next();
}

module.exports = authMiddleware;
