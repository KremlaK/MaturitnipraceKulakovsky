// Stáhne model pro vystřižení auta z fotky (ISNet, licence Apache-2.0) do backend/models/.
// Spuštění: npm run model:download   (stačí jednou, ~170 MB; do gitu nepatří)
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const URL = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx';
const target = path.join(__dirname, '..', 'models', 'isnet-general-use.onnx');

(async () => {
  if (fs.existsSync(target) && fs.statSync(target).size > 100e6) {
    console.log('Model už je stažený:', target);
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  console.log('Stahuji model…');
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Stažení selhalo: HTTP ${res.status}`);
  const tmp = `${target}.part`;
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  fs.renameSync(tmp, target);
  console.log(`Hotovo: ${target} (${(fs.statSync(target).size / 1e6).toFixed(0)} MB)`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
