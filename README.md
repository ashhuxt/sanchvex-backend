<div align="center">

# 🚀 Sanchvex

### High-Volume Catalog Engine for Drift-Resistant Cursor Pagination

**Built for deterministic sorting, deep pagination, and large dataset handling**

<br>

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js)
![Fastify](https://img.shields.io/badge/Fastify-Core-black?style=for-the-badge&logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)
![API](https://img.shields.io/badge/API-Catalog%20Engine-blue?style=for-the-badge)
![Pagination](https://img.shields.io/badge/Pagination-Cursor--Based-purple?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Prototype-success?style=for-the-badge)

</div>

> Sanchvex is a backend catalog engine designed to keep pagination stable under heavy data growth, concurrent inserts, and deep scrolling workflows.

---

# 🧠 Overview

Sanchvex solves two common problems in high-volume catalog systems:

- **data drift** during active browsing
- **scale degradation** when users move through large datasets

Instead of offset pagination, Sanchvex uses **cursor-based navigation** with deterministic sorting. This keeps page boundaries stable even when new rows are inserted while a user is browsing.

The system is optimized for:

- large product catalogs
- deep pagination
- stable ordering
- fast bulk seeding
- repeatable API responses

---

# 🎯 Problem Statement

Traditional `LIMIT / OFFSET` pagination becomes unreliable at scale.

When rows are inserted or deleted between requests:

- users may see duplicates
- items may be skipped
- page boundaries shift
- deep pagination becomes slower

This is a serious problem in live catalog systems where consistency matters more than simple page slicing.

---

# 💡 Solution

Sanchvex uses a **cursor-based pagination model** anchored on immutable row boundaries.

The approach combines:

- timestamp ordering
- unique ID tie-breaking
- composite indexing
- opaque cursor tokens
- batch ingestion for large data seeding

This gives the API a stable browsing experience across large and changing datasets.

---

# 🏗️ Core Architecture

```text
Client Request
      ↓
Fastify Route
      ↓
Cursor Decoder
      ↓
Deterministic Sort Filter
      ↓
PostgreSQL Indexed Lookup
      ↓
Next Cursor Generation
      ↓
JSON Response
````

---

# ⚡ Core Engineering Features

## Cursor-Based Pagination

* designed for stable browsing through large catalogs
* prevents duplicate and skipped items caused by shifting offsets
* supports deep navigation without scanning every earlier row

## Deterministic Sorting

Records are ordered using:

* `created_at`
* `id` as a tie-breaker

This makes ordering predictable even when timestamps match.

## High-Volume Batch Seeding

* inserts records in large chunks
* reduces overhead compared to row-by-row insertion
* suitable for testing large catalog volumes

## Opaque Cursor Tokens

* cursor state is encoded into web-safe tokens
* keeps API requests compact
* hides raw pagination boundary values from clients

## Category Filtering

* supports browsing by product category
* works cleanly with cursor pagination
* maintains stable ordering within filtered results

---

# 🧮 Pagination Logic

When two rows share the same timestamp, Sanchvex applies a compound boundary rule:

```
(created_at < \text{cursor_timestamp}) \lor (created_at = \text{cursor_timestamp} \land id < \text{cursor_id})

```
This ensures that pagination remains deterministic even when many records are created within the same time window.

---

# 💾 Database Design

Sanchvex uses PostgreSQL with optimized indexing for cursor-based browsing.

## Table Structure

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Index Strategy

```sql
CREATE INDEX idx_products_category_created_id
ON products (category, created_at DESC, id DESC);

CREATE INDEX idx_products_created_id
ON products (created_at DESC, id DESC);
```

These indexes support:

* fast lookup by category
* stable ordering
* efficient cursor-based reads
* deterministic tie resolution

---

# 📈 Performance Notes

| Pagination Method |     First Page |               Deep Pages | Stability       |
| ----------------- | -------------: | -----------------------: | --------------- |
| Offset Pagination | Fast initially | Slows down as pages grow | Volatile        |
| Cursor Pagination |           Fast | Stable for deep browsing | Drift-resistant |

Sanchvex is designed to keep browsing consistent even when the underlying dataset changes during active use.

---

# 🧪 Validation Workflow

The repository includes automated drift testing to verify stability under data mutation.

Typical validation flow:

```bash
node test-drift.js
```

Expected behavior:

* fetch one page
* inject new rows
* fetch next page using cursor
* confirm no duplicates or gaps

---

# 🌐 API Contract

## `GET /api/products`

Returns paginated catalog data sorted by newest records first.

### Query Parameters

| Parameter  | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| `limit`    | integer | Number of items to return    |
| `category` | string  | Optional category filter     |
| `cursor`   | string  | Opaque cursor boundary token |

### Example Response

```json
{
  "products": [
    {
      "id": 14500,
      "name": "Product Item 14499",
      "category": "Electronics",
      "price": "499.99",
      "created_at": "2026-06-22T17:00:00.000Z"
    }
  ],
  "nextCursor": "MjAyNi0wNi0yMlQxNzowMDowMC4wMDBaXzE0NTAw",
  "hasNextPage": true
}
```

---

# 🛠️ Tech Stack

| Layer               | Technology                                       |
| ------------------- | ------------------------------------------------ |
| Runtime Engine      | Node.js (v20+)                                   |
| API Framework       | Fastify (Low-Overhead, High-Throughput REST)     |
| Database Server     | PostgreSQL (Serverless Neon Pooler)              |
| Pagination Strategy | Deep Cursor-based Opaque Tokenization            |
| Data Ingestion      | Batch-Vector Seeding Optimization (`B = 10,000`) |
| Cloud Hosting       | Render Containers                                |

---

# 📂 Project Structure

```text
sanchvex-backend/
├── public/
│   └── index.html
├── .env
├── .gitignore
├── package.json
├── seed.js
├── server.js
└── test-drift.js
```

---

# 🚀 Local Setup

## Prerequisites

* Node.js 20+
* PostgreSQL database
* npm

## 1) Clone the Repository

```bash
git clone https://github.com/ashhuxt/sanchvex-backend.git
cd sanchvex-backend
```

## 2) Install Dependencies

```bash
npm install
```

## 3) Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
PORT=3000
```

## 4) Seed the Database

```bash
node seed.js
```

## 5) Start the Server

```bash
node server.js
```

The API will be available at:

```text
http://localhost:3000/
```

---

# 🔍 Drift Validation

Run the drift test to verify that pagination remains stable even when new data is inserted between page requests:

```bash
node test-drift.js
```

This test checks that:

* cursor boundaries remain stable
* duplicate rows do not appear
* rows are not skipped during scrolling
* ordering stays deterministic

---

# 📡 Production Endpoints

## API Endpoint

```text
https://sanchvex-backend.onrender.com/api/products?limit=12
```

## Live Interactive UI

```text
https://sanchvex-backend.onrender.com
```

---

# ⚠️ Current Limitations

Sanchvex is intentionally focused on core catalog pagination and consistency. Areas that can be extended later include:

* admin dashboard for dataset inspection
* category analytics
* vector search
* product mutation history
* multi-region deployment tuning
* advanced observability

---

# 🚀 Future Work

* add a visual admin dashboard
* support advanced filtering combinations
* add analytics on browsing behavior
* introduce caching for repeated catalog views
* expand drift tests for high-concurrency mutation scenarios
* add export/import support for catalog snapshots

---

# 👨‍💻 Developer

**Ashish Patel**

Focused on:

* backend systems
* data-intensive APIs
* performance-aware engineering
* scalable catalog design

---

# 🌟 Final Note

Sanchvex is built around a simple idea:
**pagination should remain stable even when the data is not.**

```
```
