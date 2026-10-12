# Backend security and deployment settings

## Required before deploying

Set `ADMIN_PASSWORD` as a private environment variable on the Render API service. Use a unique password with at least 16 characters. The API deliberately refuses admin login when this variable is missing. Do not use a `VITE_` variable for secrets.

The production frontend origin is allowed by default. If the site uses another domain or a Vercel preview URL, add it to `ALLOWED_ORIGINS` as a comma-separated list. CORS is an additional browser restriction; API authorization remains the actual access control.

## Render health check

In the Render API service settings, set the health check path to `/health`. This endpoint verifies both that the API is responding and that SQLite can execute a query. It does not expose database contents.

## Database persistence

Set `DATABASE_PATH` to `elshadday.db` inside the persistent disk mount configured for the Render service. First back up and copy the existing database to that path; pointing the API at a new empty file makes existing orders and menus appear missing. A file stored outside a persistent mount may be lost when the service is replaced. Keep a separate backup and test restoring it before relying on the database for long-term order history.

For local development, the database path remains relative to the process working directory for compatibility with the current setup. Start the backend from the `backend` directory; the example value `./elshadday.db` assumes that working directory.

## Admin sessions

The login route issues an eight-hour in-memory session. Restarting or redeploying the API invalidates all admin sessions, so the owner will need to log in again. Admin tokens stay in the current browser tab's `sessionStorage` and are never embedded in the frontend build.
