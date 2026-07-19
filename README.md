# Nyodera Heights Backend API

This repository contains the backend API for the Nyodera Heights property management system.

## Database

The backend now supports PostgreSQL storage via `DATABASE_URL`.

Required environment variables:
- `DATABASE_URL`
- `DATABASE_SSL` (set to `true` if your Postgres provider requires SSL)

If `DATABASE_URL` is not configured, the app will continue to use local JSON files as a fallback.

## Run locally

1. Copy `.env.example` to `.env`
2. Set your database and payment provider environment variables
3. Run `npm install`
4. Start the app with `npm start`

## Panel deployment

For panel deployment, use the committed `deploy.env` file and copy it to the remote project directory as `.env`.

Example remote setup commands:

```bash
cd /home/container
[ -f .env ] && mv .env .env.bak.$(date +%s)
cp deploy.env .env
npm install --no-audit --no-fund
npm run db-test
```

If the DB test passes, start the app with PM2:

```bash
npm install -g pm2
cat > ecosystem.config.js <<'JS'
module.exports = {
  apps: [{
    name: 'nyodera',
    script: 'index.js',
    cwd: '/home/container',
    env: { NODE_ENV: 'production' }
  }]
};
JS
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

You can check logs with:

```bash
pm2 status
pm2 logs nyodera --lines 200
```

The app should now serve on the configured `HOST` and `PORT` values.

The backend exposes `GET /` in addition to `/health`, `/config`, and the `/api/*` routes used by the `NH-frontend` repository.
