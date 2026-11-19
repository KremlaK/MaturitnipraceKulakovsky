// Odkazy na soubory přijímáme jen z našeho Cloudinary účtu (kam vede /api/upload).
// Jinak by šlo uložit odkaz na cizí web nebo „javascript:“ a ten pak ukázat jiným uživatelům.
function isAllowedFileUrl(value) {
  if (typeof value !== 'string' || value.length > 1000) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return false;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return !cloud || url.pathname.startsWith(`/${cloud}/`);
}

// undefined = pole neposláno (beze změny), '' / null = smazat, jinak musí jít o povolený odkaz
function parseFileUrl(value) {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  if (isAllowedFileUrl(value)) return { value };
  return { error: 'Neplatný odkaz na soubor. Nahraj soubor znovu přes aplikaci.' };
}

module.exports = { isAllowedFileUrl, parseFileUrl };
