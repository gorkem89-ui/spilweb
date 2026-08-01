[README.md](https://github.com/user-attachments/files/30618220/README.md)
# Spilweb

Spilweb is a bilingual web design company platform foundation using VueJs 3, Vite, Node.js, Express, and MySQL. Sprint 5 adds a customer portal, CRM, project management, support tickets, quotes, invoices, files, and calendar scaffolding.

## Stack

- Frontend: VueJs 3, Vite, Vue Router, Pinia, Vue I18n, Axios, Bootstrap 5.3
- Backend: Node.js, Express, MySQL2, JWT, Helmet, CORS, Rate Limit, Swagger
- Database: MySQL 8.4
- Tooling: ESLint, Prettier

## Project Structure

```text
spilweb/
  brand-assets/
  frontend/
  backend/
  database/
  docs/
```

## Brand Assets

Logo files are included separately in `brand-assets/`:

- `spilweb-logo-full.svg`
- `spilweb-logo-mark.svg`
- `spilweb-favicon.svg`

The frontend also serves visual assets from `frontend/public/brand/` for the hero and portfolio showcase areas.

## Run Locally

Import the single database installation file. It creates and selects the `spilweb` database automatically:

```bash
mysql -u root -p < database/spilweb_database.sql
```

In the XAMPP MariaDB monitor on Windows, use a forward-slash path without a trailing semicolon:

```sql
SOURCE D:/UnityVerse_Academy_Egitim/proje/Spilweb/database/spilweb_database.sql
```

Alternatively, after creating `backend/.env`, run the installer from the project root:

```bash
npm run db:migrate
```

Create environment files and update database credentials in `backend/.env`:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Install dependencies:

```bash
cd frontend
npm install
npm run dev
```

In another terminal:

```bash
cd backend
npm install
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger: http://localhost:5000/api/docs

## API Endpoints

- `GET /api/health`
- `GET /api/languages`
- `GET /api/settings`
- `POST /api/contact`
- `POST /api/quote`
- `GET /api/admin/dashboard`
- `GET /api/admin/content/:type`
- `POST /api/admin/content/:type`
- `GET /api/admin/messages`
- `GET /api/admin/users`
- `GET /api/admin/settings`
- `GET /api/admin/page-builder/:pageKey`
- `POST /api/admin/page-builder/:pageKey/blocks`
- `GET /api/admin/theme`
- `POST /api/admin/theme`
- `GET /api/admin/analytics`
- `GET /api/admin/notifications`
- `GET /api/admin/activity-logs`
- `GET /api/admin/backups`
- `POST /api/admin/backups`
- `GET /api/admin/api-keys`
- `POST /api/admin/api-keys`
- `GET /api/admin/system-health`
- `GET /api/portal/dashboard`
- `GET /api/portal/projects`
- `GET /api/portal/tasks`
- `GET /api/portal/quotes`
- `GET /api/portal/invoices`
- `GET /api/portal/tickets`
- `POST /api/portal/tickets`
- `GET /api/portal/files`
- `GET /api/portal/calendar`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Sprint 1 Pages

- `/tr` and `/en`: Home
- `/tr/login` and `/en/login`: Login
- `/tr/register` and `/en/register`: Register
- `404`: Not Found

## Sprint 2 Pages

- `/tr/about` and `/en/about`
- `/tr/services` and `/en/services`
- `/tr/portfolio` and `/en/portfolio`
- `/tr/blog` and `/en/blog`
- `/tr/contact` and `/en/contact`
- `/tr/quote` and `/en/quote`

## Sprint 2 Features

- Responsive corporate design
- Dark-first professional visual theme with vivid cyan, blue, and gold accents
- Refined mountain logo and separate SVG logo exports
- Light and dark theme toggle
- TR / EN language switch
- SEO title, description, Open Graph, and canonical helper
- Contact and quote forms backed by Express endpoints
- `contact_messages` database table
- SMTP notifications through Nodemailer with configurable recipient and visitor `Reply-To`

## Sprint 3 Admin Pages

- `/tr/admin` and `/en/admin`: Dashboard
- `/tr/admin/pages` and `/en/admin/pages`
- `/tr/admin/services` and `/en/admin/services`
- `/tr/admin/portfolio` and `/en/admin/portfolio`
- `/tr/admin/blog` and `/en/admin/blog`
- `/tr/admin/media` and `/en/admin/media`
- `/tr/admin/messages` and `/en/admin/messages`
- `/tr/admin/users` and `/en/admin/users`
- `/tr/admin/settings` and `/en/admin/settings`

## Sprint 4 Admin Pages

- `/tr/admin/builder` and `/en/admin/builder`
- `/tr/admin/theme` and `/en/admin/theme`
- `/tr/admin/analytics` and `/en/admin/analytics`
- `/tr/admin/notifications` and `/en/admin/notifications`
- `/tr/admin/activity` and `/en/admin/activity`
- `/tr/admin/backups` and `/en/admin/backups`
- `/tr/admin/api-keys` and `/en/admin/api-keys`
- `/tr/admin/system-health` and `/en/admin/system-health`

## Sprint 3 Features

- Admin sidebar and topbar
- Dashboard stat cards
- Shared content management screen
- Message and quote inbox
- User listing
- Settings listing
- Media library placeholder
- `content_items`, `media_files`, and `audit_logs` database tables
- Protected `/api/admin/*` routes with JWT authentication

## Sprint 4 Features

- Page Builder block model
- Theme settings model and editor screen
- Analytics summary and top pages
- Notification center
- Activity log viewer
- Backup job records
- API key registry with masked values
- System health view
- `page_blocks`, `theme_settings`, `notifications`, `analytics_daily`, `backup_jobs`, and `api_keys` database tables

## Sprint 5 Portal Pages

- `/tr/portal` and `/en/portal`: Customer dashboard
- `/tr/portal/projects` and `/en/portal/projects`
- `/tr/portal/tasks` and `/en/portal/tasks`
- `/tr/portal/quotes` and `/en/portal/quotes`
- `/tr/portal/invoices` and `/en/portal/invoices`
- `/tr/portal/support` and `/en/portal/support`
- `/tr/portal/files` and `/en/portal/files`
- `/tr/portal/calendar` and `/en/portal/calendar`

## Sprint 5 Features

- Customer portal layout
- Project progress cards
- Kanban-style task board
- Quote and invoice lists
- Support ticket creation
- Project file list
- Calendar and milestone list
- `customers`, `projects`, `project_tasks`, `crm_quotes`, `invoices`, `support_tickets`, `support_messages`, `project_files`, `calendar_events`, and `customer_notifications` database tables

## Demo and Service Packages

- New customers receive an active account and JWT session immediately.
- Registration redirects directly to the demo customer portal.
- Registration requires at least 8 characters, uppercase and lowercase letters, a number, and a special character.
- Email domains are checked against trusted providers or verified through DNS MX records before registration.
- Registration validation messages follow the selected Turkish or English interface language.
- Three service packages are available: Corporate Web, E-Commerce, and Custom Software.
- A 20% launch discount is applied: 28,000 TRY, 52,000 TRY, and 76,000 TRY.
- A purchase request creates a pending subscription and CRM quote.
- Paid portal modules return HTTP 402 until an administrator confirms payment.
- Admins can unlock the requested package from the Users screen.
- Atlas Corporate, Nova Shop, and Vera CRM include original project visuals.

## Security Update

- New registrations are active immediately but start in isolated `demo` mode.
- Real project, task, quote, invoice, support, file, and calendar data require an active paid subscription.
- Admin APIs require `super_admin`, `admin`, or `editor` role.
- Payment activation requires a `super_admin` or `admin` role.
- Portal users and admin users both have logout controls.
- Default local admin:
  - Email: `admin@spilweb.net.tr`
  - Password: `Admin123!`
  - Change this password before production.

## Notes

- Replace JWT secrets before production.
- Configure `SMTP_TO` in `backend/.env` as the inbox that receives form notifications. Replying to a contact or quote notification targets the visitor's validated email address.
- Registration creates an active `customer` role and a `demo` subscription.
- Original prices, discounted prices, and discount rates can be changed in the `service_plans` table.
- The current flow records a purchase request and supports manual payment confirmation. A live payment provider still requires provider credentials and webhook verification.
- Future sprints can add live media upload processing, encrypted secret storage, real analytics collection, scheduled backups, provider-backed online payments, PDF invoices, and customer messaging.
