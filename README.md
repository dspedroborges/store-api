# Store API

## Project Description

**Store API** is a backend service built with Express.js and TypeScript to manage an online store. It provides endpoints for users, products, transactions, reviews, discounts, and product images, as well as for processing payments through **Mercado Pago** (only Pix for now). The API uses Prisma ORM to interact with a PostgreSQL database, supporting features like authentication, authorization, and file uploads.

The database schema includes the following models:
- **Users** – manages users and admin privileges.
- **PasswordRecoveries** – handles password reset tokens.
- **RevokedTokens** – stores invalidated JWTs.
- **Logs** – tracks user requests and actions.
- **Products** – main products with details, stock, and relationships to discounts, images, transactions, and reviews.
- **Discounts** – manage product discounts with expiration dates.
- **ProductImages** – store product images.
- **Transactions** – track user purchases and their statuses.
- **Reviews** – manage user reviews and approval workflow.
- **TransactionStatus** – enum defining possible transaction states.

![DB_Diagram](diagram.png)

---

## Tech Stack

### Core
- **Node.js** & **Express.js** – Server and routing framework  
- **TypeScript** – Type-safe development  
- **Prisma ORM** + **PostgreSQL** – Database modeling and queries  

### Authentication & Security
- **JWT (jsonwebtoken)** – Token-based authentication  
- **bcryptjs** – Password hashing and verification  
- **cookie-parser** – Parse cookies  
- **express-rate-limit** – Limit request rates  
- **xss** – Sanitize input and prevent XSS attacks  

### Utilities
- **dotenv** – Load environment variables  
- **uuid** – Generate unique identifiers  
- **Multer** – Handle file uploads  
- **node-cron** – Schedule automated tasks  

### Development
- **ts-node-dev** – Hot-reload TypeScript server during development  

### Integrations
- **Mercado Pago** – Payment processing

---

## Scripts
- `npm run dev` – start the development server with hot reload
- `npm run build` – compile TypeScript to JavaScript
- `npm start` – run the compiled server

---

## Environment Variables
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – secret key for signing JWT tokens
- `PORT` – the port where the server is going to run
- `MERCADOPAGO_ACCESS_TOKEN` - access token to process MP payments

---

## API

### Overview

- `/api/users` – manage users
- `/api/products` – manage products
- `/api/product/images` – upload/delete product images
- `/api/transactions` – track purchases
- `/api/reviews` – manage user reviews
- `/api/discounts` – manage product discounts
- `/api/auth` – login, logout, password recovery