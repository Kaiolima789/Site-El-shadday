# Backend security and deployment settings

## Required before deploying

Set `ADMIN_PASSWORD` as a private environment variable on the Render API service. Use a unique password with at least 16 characters. The API deliberately refuses admin login when this variable is missing. Do not use a `VITE_` variable for secrets.

The production frontend origin is allowed by default. If the site uses another domain or a Vercel preview URL, add it to `ALLOWED_ORIGINS` as a comma-separated list. CORS is an additional browser restriction; API authorization remains the actual access control.

## Render health check

In the Render API service settings, set the health check path to `/health`. This endpoint verifies that the API can execute a query against its configured database. It does not expose database contents.

## PostgreSQL on Supabase

When `DATABASE_URL` is set, the API uses PostgreSQL, including Supabase Postgres. Leave it unset for local SQLite development. Never commit a real connection string.

For a backend that runs continuously on Render, use Supabase's **Session pooler** connection string when the direct connection is unavailable (for example, due to IPv4 compatibility). Do not use the Transaction pooler for this app: the API uses explicit database transactions for menu updates and SQLite imports. Copy the connection string from Supabase **Connect** and keep its SSL requirement (`sslmode=require`) intact. The same URL can be used from your computer for the initial import and from Render after cutover; store it only in environment variables.

PostgreSQL is the recommended production database for concurrent orders and future API scaling. Before scaling the API to multiple instances, use PostgreSQL and confirm that all shared state is in the database; admin sessions are stored there, while per-IP rate limits are still process-local.

## Migrating existing SQLite data

Do not set `DATABASE_URL` on the live API until the current production SQLite database has been copied and imported. Pointing the API at an empty PostgreSQL database makes menus and orders appear missing.

1. Create a Supabase project and keep the API service running on SQLite for now. Choose the Supabase Session pooler URL for a persistent Render backend.
2. Create and verify a SQLite backup from the **production database**, then copy that backup to a trusted machine. Do not assume the local development database contains production orders.
3. From `backend`, set `DATABASE_URL` to the Supabase Session pooler connection string and `DATABASE_SOURCE_PATH` to the copied SQLite file. Run `npm run migrate:postgres` with `CONFIRM_POSTGRES_IMPORT=YES`. The importer refuses a PostgreSQL database that already contains rows and imports the menu and order tables in a transaction.
4. Verify menu and order counts and sample records in Supabase before cutover. For a consistent final cutover, pause new orders, take a final SQLite backup, import it into a clean Supabase project, set the Render API's `DATABASE_URL` to the same Supabase Session pooler connection string, redeploy, and verify `/health`, menu loading, order submission, and the admin queue. Resume orders after verification.
5. Keep the SQLite source and its backup unchanged until the PostgreSQL service is verified in production.

## PostgreSQL backups

The SQLite daily backup scheduler runs only when the API is using SQLite. Configure and review Supabase's database backups and recovery options in the Supabase dashboard for the selected plan. For long-term offsite retention, configure a separate export destination and periodically verify a restore.

## Order prices

The API calculates meal prices from today's active menu, beverage prices from the server's fixed price list, and delivery fees from the selected region. Prices submitted by the browser are not used as the amount to charge. Keep the server beverage price list in sync when changing the prices shown in the frontend.

For local development, the database path remains relative to the process working directory for compatibility with the current setup. Start the backend from the `backend` directory; the example value `./elshadday.db` assumes that working directory.

## Admin sessions

The login route issues an eight-hour session stored in the configured database, so it works across API instances and survives restarts until expiration or logout. Admin tokens stay in the current browser tab's `sessionStorage` and are never embedded in the frontend build. Login and order rate limits are still process-local; keep one API instance until those limits are moved to shared storage or an edge provider.
