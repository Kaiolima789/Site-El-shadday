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

For local development, the database path remains relative to the process working directory for compatibility with the current setup. Start the backend from the `backend` directory; the example value `./elshadday.db` assumes that working directory.

## Admin sessions

The login route issues an eight-hour in-memory session. Restarting or redeploying the API invalidates all admin sessions, so the owner will need to log in again. Admin tokens stay in the current browser tab's `sessionStorage` and are never embedded in the frontend build.
