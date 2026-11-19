# AutoApp

Digitální garáž a servisní knížka pro osobní a rodinná auta: tankování se spotřebou, servisní historie s fakturami, výdaje, připomínky STK a servisu, sdílení auta s rodinou nebo servisem, export do PDF a Excelu.

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Leaflet
- **Backend:** Node.js, Express 5, Prisma 7, PostgreSQL, Resend (e-maily), Cloudinary (fotky a faktury)

## Spuštění pro vývoj

Potřebuješ Node.js 20+ a PostgreSQL.

```bash
# backend
cd backend
cp .env.example .env        # a vyplň hodnoty (viz níže)
npm install
npx prisma migrate deploy   # vytvoří tabulky
npm run dev                 # http://localhost:5000

# frontend (v druhém terminálu)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Bez `RESEND_API_KEY` se při vývoji e-maily (ověření, obnova hesla) jen vypíšou do konzole backendu – odkaz z nich jde rovnou otevřít.

Testy backendu: `cd backend && npm test`. Kontrola frontendu: `cd frontend && npm run lint && npm run build`.

## Proměnné prostředí

Všechny jsou popsané v [`backend/.env.example`](backend/.env.example) a [`frontend/.env.example`](frontend/.env.example). Soubory `.env` jsou v `.gitignore` a **nikdy nepatří do gitu**.

Server se odmítne spustit, když chybí `DATABASE_URL` nebo je `JWT_SECRET` kratší než 32 znaků (a v produkci i když `FRONTEND_URL` nezačíná `https://`).

## Zabezpečení

- Hesla jako bcrypt otisk (12 kol); odkazy pro ověření e-mailu a obnovu hesla jen jako SHA-256 otisk, jednorázové a časově omezené.
- Změna nebo obnova hesla zneplatní všechna dříve vydaná přihlášení (`tokenVersion`).
- Omezení počtu pokusů: přihlášení 10 neúspěšných / 15 min, registrace a e-maily 10 / h, celé API 300 / min na IP.
- CORS jen pro `FRONTEND_URL`, bezpečnostní hlavičky (helmet), limit velikosti požadavků.
- Nahrané soubory se kontrolují podle obsahu (JPEG, PNG, WEBP, PDF do 10 MB); odkazy na soubory se přijímají jen z vlastního Cloudinary účtu.
- Upozornění e-mailem chodí jen na ověřené adresy.

## Nasazení na server s Apachem

1. **Backend** běží jako služba (systemd), Apache před ním dělá HTTPS a přeposílá `/api`.

   `backend/.env` v produkci:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://autoapp.example.cz
   TRUST_PROXY=1
   ```

   `/etc/systemd/system/autoapp.service`:
   ```ini
   [Unit]
   Description=AutoApp API
   After=network.target postgresql.service

   [Service]
   WorkingDirectory=/var/www/autoapp/backend
   ExecStart=/usr/bin/node server.js
   Restart=always
   User=www-data
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   sudo systemctl enable --now autoapp
   ```

2. **Frontend** se sestaví s API na stejné doméně:
   ```bash
   cd frontend && VITE_API_URL=/api npm run build   # výsledek v frontend/dist
   ```

3. **Apache** (`sudo a2enmod proxy proxy_http rewrite headers ssl`):
   ```apache
   <VirtualHost *:80>
       ServerName autoapp.example.cz
       DocumentRoot /var/www/autoapp/frontend/dist

       <Directory /var/www/autoapp/frontend/dist>
           Require all granted
           RewriteEngine On
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteCond %{REQUEST_URI} !^/api/
           RewriteRule ^ /index.html [L]
       </Directory>

       ProxyPreserveHost On
       ProxyPass        /api/ http://127.0.0.1:5000/api/
       ProxyPassReverse /api/ http://127.0.0.1:5000/api/
       LimitRequestBody 20971520
   </VirtualHost>
   ```
   HTTPS: `sudo certbot --apache -d autoapp.example.cz`.

4. **Zálohy databáze** (např. denně cronem):
   ```bash
   pg_dump "$DATABASE_URL" | gzip > /var/backups/autoapp-$(date +%F).sql.gz
   ```

`.env` na serveru nastav jen pro uživatele služby: `chmod 600 backend/.env`.
