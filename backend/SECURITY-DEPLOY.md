# Backend security and deployment settings

## Required before deploying

Set `ADMIN_PASSWORD` as a private environment variable on the Render API service. Use a unique password with at least 16 characters. The API deliberately refuses admin login when this variable is missing. Do not use a `VITE_` variable for secrets.

The production frontend origin is allowed by default. If the site uses another domain or a Vercel preview URL, add it to `ALLOWED_ORIGINS` as a comma-separated list. CORS is an additional browser restriction; API authorization remains the actual access control.

## Render health check

In the Render API service settings, set the health check path to `/health`. This endpoint verifies both that the API is responding and that SQLite can execute a query. It does not expose database contents.

## PostgreSQL on Render

When `DATABASE_URL` is set, the API uses PostgreSQL. For the Render API, set `DATABASE_URL` to the database's **internal** connection string and keep the API and database in the same region. Leave `DATABASE_URL` unset for local SQLite development. Never commit a real connection string.

PostgreSQL is the recommended production database for concurrent orders and future API scaling. Before scaling the API to multiple instances, use PostgreSQL and confirm that all shared state is in the database; admin sessions are stored there, while per-IP rate limits are still process-local.

## Migrating existing SQLite data

Do not set `DATABASE_URL` on the live API until the current production SQLite database has been copied and imported. Pointing the API at an empty PostgreSQL database makes menus and orders appear missing.

1. Create a Render PostgreSQL database and keep the API service running on SQLite for now. Check current pricing and recovery options in Render before choosing a plan.
2. Create and verify a SQLite backup from the **production database**, then copy that backup to a trusted machine. Do not assume the local development database contains production orders.
3. From `backend`, set `DATABASE_URL` to the PostgreSQL external connection string for the one-time import and set `DATABASE_SOURCE_PATH` to the copied SQLite file. Run `npm run migrate:postgres` with `CONFIRM_POSTGRES_IMPORT=YES`. The importer refuses a PostgreSQL database that already contains rows and imports the menu and order tables in a transaction.
4. Verify menu and order counts and sample records in PostgreSQL before cutover. For a consistent final cutover, pause new orders, take a final SQLite backup, import it into a clean PostgreSQL database, set the Render API's `DATABASE_URL` to the PostgreSQL **internal** URL, redeploy, and verify `/health`, menu loading, order submission, and the admin queue. Resume orders after verification.
5. Keep the SQLite source and its backup unchanged until the PostgreSQL service is verified in production.

## PostgreSQL backups

The SQLite daily backup scheduler runs only when the API is using SQLite. PostgreSQL backups are managed by Render according to the selected database plan. Check the database's Recovery page after setup; Render documents point-in-time recovery for paid databases and logical exports. For long-term offsite retention, configure a separate export destination and periodically verify a restore.

## Order prices

The API calculates meal prices from today's active menu, beverage prices from the server's fixed price list, and delivery fees from the selected region. Prices submitted by the browser are not used as the amount to charge. Keep the server beverage price list in sync when changing the prices shown in the frontend.

For local development, the database path remains relative to the process working directory for compatibility with the current setup. Start the backend from the `backend` directory; the example value `./elshadday.db` assumes that working directory.

## Admin sessions

The login route issues an eight-hour session stored in the configured database, so it works across API instances and survives restarts until expiration or logout. Admin tokens stay in the current browser tab's `sessionStorage` and are never embedded in the frontend build. Login and order rate limits are still process-local; keep one API instance until those limits are moved to shared storage or an edge provider.
