# ShopEase — E-Commerce Order & Inventory Management System

A responsive MERN application for product and inventory management, customer checkout, carts, and order fulfillment. The API uses atomic stock updates and compensating stock restoration on failed order creation/cancellation, so it works with a standard MongoDB deployment without requiring replica-set transactions.

## Requirements

- Node.js 18.11+
- MongoDB running locally or a MongoDB connection string

## Setup

1. Install MongoDB Server, or use MongoDB Atlas: create a database user, allow the development machine's IP in **Network Access**, and copy the Atlas **Drivers / Node.js** connection string.
2. Set `MONGO_URI` in `server/.env` to `mongodb://127.0.0.1:27017/ecommerce_inventory` for a local database, or replace `DB_USER`, `DB_PASSWORD`, and `cluster0.xxxxx.mongodb.net` with the Atlas connection details. URL-encode any special characters in Atlas database usernames and passwords. For a local install, add `mongod` to `PATH` or set `MONGOD_PATH` to its executable in `server/.env`. The dev server starts a missing local MongoDB process automatically and binds it to localhost only.
3. Set `JWT_SECRET` to a fresh secret (PowerShell: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Choose a unique `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters). Never commit `server/.env`; it is gitignored. `.env.example` and `server/.env.example` contain placeholders only.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Add the sample catalog and create/update the admin account:

   ```bash
   npm.cmd run seed
   ```

   To add only the 32 ShopEase sample products without changing existing products, run:

   ```powershell
   npm.cmd run seed:products
   ```

   The product seed is idempotent and only inserts missing product IDs. It never deletes records or resets stock.

6. Start the Express API and Vite frontend:

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:5000](http://localhost:5000).

To run them in separate terminals instead, use `npm run dev:server` and `npm run dev:client` from the project root (or `npm run dev --prefix server` and `npm run dev --prefix client`).

The server loads `server/.env` first and the project-root `.env` as a fallback. The client API URL is set in `client/.env` to `http://localhost:5000/api`. Vite is pinned to port 5173 and will report an error rather than switch ports if 5173 is occupied. CORS allows `http://localhost:5173`, `http://127.0.0.1:5173`, and the configured `CLIENT_URL`.

## Authentication and roles

- Customer registration at `/login?mode=register` creates a regular `user` account and a linked delivery profile. Public sign-up can never choose the admin role.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`; `npm.cmd run seed` hashes the password and creates/promotes that account to `admin`. Seed again to rotate the bootstrap password.
- Sign in at `/login`. JWT bearer tokens expire after `JWT_EXPIRES_IN` (default `8h`).
- Product reads remain public. Product create/update/delete, customer directory management, and order status updates require an admin token. Customers can access only their own cart, order history, and order details.
- The UI hides admin links from customer accounts and guards admin pages; API role checks are authoritative.

## Features

- Search by product name, category, or ID; filter by category and browse product photos and details.
- Browse the INR-priced ShopEase catalog across Electronics, Fashion, Home, Books, Sports, Beauty, Groceries, and Toys.
- Create, edit, and remove products in the admin product area.
- Add items to a customer-specific cart, adjust quantities, and check out.
- Register/select customers at checkout; view and maintain customer records.
- Create orders with saved item, image, and price snapshots and automatically reduce stock.
- Progress orders through Placed → Processing → Shipped → Delivered, or cancel eligible orders and restore stock (customers can cancel their own Placed or Processing orders).
- API request validation and consistent `{ success, data, message }` / `{ success, error }` JSON responses.

## Project layout

```text
client/                 React + Vite frontend
  src/components/       Shared navigation, layout, feedback UI
  src/context/           Cart, customer, and toast state
  src/pages/              Catalog, checkout, admin, and order pages
  src/services/           Axios API client
server/src/
  config/                 Database connection and environment loading
  controllers/            Route handlers and business logic
  middleware/             Authentication, authorization, validation, errors
  models/                 Mongoose schemas
  routes/                 REST API routes
  scripts/                Sample data/admin seeder
```

## REST API

All endpoints are prefixed with `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a customer account (always role `user`) |
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/auth/me` | Get the signed-in account |
| GET, POST | `/api/products` | List/search (`?search=&category=`) or create products |
| GET, PUT, DELETE | `/api/products/:id` | Read, update, or delete a product |
| GET, POST | `/api/customers` | List own profile (user) or directory (admin); create (admin) |
| PUT, DELETE | `/api/customers/:id` | Update or delete a customer |
| GET | `/api/cart?customerId=...` | Get a customer's cart |
| POST | `/api/cart/items` | Add `{ customerId, productId, quantity }` |
| PUT | `/api/cart/items/:productId` | Set `{ customerId, quantity }` |
| DELETE | `/api/cart/items/:productId` | Remove with `{ customerId }` in the request body |
| GET, POST | `/api/orders` | List the signed-in customer's orders (admins see all) or create `{ customerId, cartCustomerId? }` |
| GET | `/api/orders/:id` | Read order details |
| PATCH | `/api/orders/:id/status` | Advance with `{ status }` |
| POST | `/api/orders/:id/cancel` | Cancel an eligible order and restore inventory |

All cart and order routes require a bearer token. Customers can cancel their own Placed or Processing orders; administrators can cancel Placed, Processing, or Shipped orders. `cartCustomerId` lets an administrator place a selected cart under a different customer; it defaults to `customerId`. Responses use `{ success, data, message }` on success and `{ success: false, error }` on failure.

Run API middleware/validation tests with `npm.cmd test`. A live seed and database-backed API test require a valid Atlas URI, Atlas network access, and the configured database credentials.
