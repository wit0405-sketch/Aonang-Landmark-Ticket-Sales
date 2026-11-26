# Aonang Landmark Boxing Stadium — Standalone Ticket Sales

Independent ticket sales web app. It does not import, call, or modify the stadium's existing booking system.

## Stack
- Cloudflare Pages + Pages Functions
- Cloudflare D1 (new, dedicated database)
- Vanilla HTML/CSS/JavaScript frontend
- Shared seat inventory across all tour counters
- Admin-created counter accounts; password hashes use PBKDF2; session tokens are stored hashed

## Included
- Admin dashboard: daily totals, sales by counter, recent sales
- Counter management: add/disable tour companies, create login accounts
- Counter sales: event date, customer name, seat category, shared seat availability, payment method
- Ticket receipt with reference number
- Seat uniqueness enforced by D1 unique constraints
- CSV export for sales
- Admin-editable ticket prices

## Seat map defaults
- Ringside S1–S66: 1,800 THB (initial value; verify before live sales)
- VIP A1–H18: 1,200 THB
- Grandstand GT1–GT80: 1,000 THB

Prices can be changed from Admin → Settings. VIP uses A1–H18 (rows A–H, seats 1–18). Grandstand uses GT1–GT80 so its identifiers never collide with VIP row G.

## Deploy
1. Create a **new, separate GitHub repository** (suggested name: `Aonang-Landmark-Ticket-Sales`). Do not put these files in the existing stadium website repository.
2. Upload the contents of this folder to the new repository.
3. In Cloudflare Pages, create a new Pages project connected to that new repository.
4. Create a **new D1 database**, for example `aonang-ticket-sales-db`.
5. Bind that database to the Pages project using the binding name `DB`.
6. Apply `migrations/0001_init.sql` to the new D1 database.
7. Set a Pages secret named `ADMIN_PASSWORD` (strong password, at least 14 characters). Set `SESSION_SECRET` to a separate long random secret.
8. Deploy. Open `/admin.html`, sign in using username `admin` and the `ADMIN_PASSWORD` secret.
9. Create tour counter accounts in Admin → Counters.

### D1 migration
Using Wrangler:
```bash
npx wrangler d1 create aonang-ticket-sales-db
npx wrangler d1 migrations apply aonang-ticket-sales-db --remote
```
Ensure `wrangler.toml` has the actual database ID returned by Cloudflare, then deploy.

## Important before production
- Confirm final seat prices and event dates.
- Configure a custom domain and HTTPS in Cloudflare.
- Keep `ADMIN_PASSWORD` and `SESSION_SECRET` private.
- Test two separate counters attempting to sell the same seat; only one sale should succeed.
- Configure Cloudflare backups/exports for the new D1 database.
- This starter does not integrate payment gateways. Payment method is recorded as cash or bank transfer; staff confirm payment at the counter.
