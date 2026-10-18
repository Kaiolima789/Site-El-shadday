# Backend security and deployment settings

## Required before deploying

Set `ADMIN_PASSWORD` as a private environment variable on the Render API service. Use a unique password with at least 16 characters. The API deliberately refuses admin login when this variable is missing. Do not use a `VITE_` variable for secrets.

The production frontend origin is allowed by default. If the site uses another domain or a Vercel preview URL, add it to `ALLOWED_ORIGINS` as a comma-separated list. CORS is an additional browser restriction; API authorization remains the actual access control.

## Render health check

In the Render API service settings, set the health check path to `/health`. This endpoint verifies both that the API is responding and that SQLite can execute a query. It does not expose database contents.

## Database persistence

For the Render API service, use `/var/data` as the disk mount path and set `DATABASE_PATH` to `/var/data/elshadday.db`. Render preserves only files under the disk mount path.

**Do not attach a new empty disk or change `DATABASE_PATH` until the current live database has been backed up and copied to `/var/data/elshadday.db`.** Mounting an empty disk hides files previously at that path, and pointing the API at a new empty database makes existing orders and menus appear missing. Keep a separate backup and verify the restored database before considering the migration complete.

Persistent disks are available only for paid Render services, cost extra per GB-month, and cause a few seconds of downtime when attached. Check the current plan and total price in the Render dashboard before adding one. A Render disk also cannot be shared across scaled service instances.

## Database backups

Run `npm run backup` from `backend` to create a consistent SQLite backup using the SQLite backup API (including pending WAL changes). Set `BACKUP_DIR` to a directory on the persistent disk, such as `/var/data/backups`, and schedule the command with an external scheduler. A backup stored on the same disk protects against accidental database changes, but not disk loss; copy backups to a separate storage account and periodically verify a restore.

The repository does not configure a scheduler or external storage credentials. Confirm that scheduled backups are running and retain at least one copy outside Render before treating the production database as backed up.

## Order prices

The API calculates meal prices from today's active menu, beverage prices from the server's fixed price list, and delivery fees from the selected region. Prices submitted by the browser are not used as the amount to charge. Keep the server beverage price list in sync when changing the prices shown in the frontend.

For local development, the database path remains relative to the process working directory for compatibility with the current setup. Start the backend from the `backend` directory; the example value `./elshadday.db` assumes that working directory.

## Admin sessions

The login route issues an eight-hour in-memory session. Restarting or redeploying the API invalidates all admin sessions, so the owner will need to log in again. Admin tokens stay in the current browser tab's `sessionStorage` and are never embedded in the frontend build.
