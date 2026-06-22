---

# 🚀 Sanchvex

A hyper-optimized backend core data engine designed to solve the **Data Drift** and **Scale Degradation** problems across high-volume catalogs. Sanchvex efficiently processes cursor-paginated data manipulation over large datasets, maintaining constant execution times and deterministic sorting consistency.

* **Live Interactive UI Dashboard:** [sanchvex-backend.onrender.com](https://www.google.com/search?q=https://sanchvex-backend.onrender.com/)
* **Production API Endpoint:** `https://sanchvex-backend.onrender.com/api/products?limit=12`

---

## ⚡ Core Engineering Achievements

* **Zero-Drift Consistency Engine:** Eliminates skipped or duplicate item abnormalities caused by real-time concurrent dataset mutations during active scrolling.
* **Constant Time Pagination $O(\log N)$:** Bypasses costly linear dataset traversal overhead characteristic of traditional SQL `OFFSET` operations.
* **High-Velocity Data Seeding Engine:** Pushes bulk records through grouped 10,000-row batch vectors, handling large datasets in seconds.
* **Opaque Tokenization Architecture:** Obfuscates database structures and state properties into web-safe Base64 alphanumeric payloads.

---

## 🏗️ System Architecture & Mathematical Logic

### The Mitigation of Data Drift

Traditional offset pagination uses linear index skips (`LIMIT 20 OFFSET 40`). If entries are inserted concurrently by other transactions, rows shift dynamically across page margins, forcing clients to experience severe duplication or data omission gaps.

Sanchvex resolves this by using an immutable cursor index boundary baseline. The pointer anchors directly onto specific unique database row records, maintaining chronological sorting integrity regardless of overhead structural data movements.

```
Traditional Offset Pagination (Volatile):
[Item 1] [Item 2] [Item 3] [Item 4] ---> Insert [New Item] ---> Elements shift down! 
                                                                (User views duplicates)

Sanchvex Cursor Pagination (Anchored):
[Item 1] [Item 2] [Item 3] (Cursor Link) ---> Insert [New Item] ---> Pointer stays fixed!
                                                                      (Seamless Navigation)

```

### Mathematical Logic Rule

To evaluate pagination criteria deterministically when records share identical millisecond-level timestamps, Sanchvex applies a compound query filtering algorithm matching this exact relation:

$$(created\_at < \text{Cursor Timestamp}) \lor (created\_at = \text{Cursor Timestamp} \land id < \text{Cursor ID})$$

This multi-column logical criteria sequence guarantees exact pagination behavior across millions of overlapping timestamps.

---

## 💾 Optimized Relational Data Modeling

The system bypasses heavy Object-Relational Mapping (ORM) translation layers, executing pure PostgreSQL Data Definition Language (DDL) directly over optimized B-Tree configurations.

### Database Table Schema

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

### Composite Index Design Strategies

To achieve rapid index scan executions, the columns inside our composite indices are structured strictly from **highest selectivity** to **lowest selectivity**.

```sql
-- Index optimization path for categorized browsing layouts
CREATE INDEX idx_products_category_created_id 
ON products (category, created_at DESC, id DESC);

-- Index optimization path for global un-categorized browsing layouts
CREATE INDEX idx_products_created_id 
ON products (created_at DESC, id DESC);

```

> **Engineering Design Detail:** Including `id DESC` serves as a bulletproof tie-breaker constraint. When two items contain identical `created_at` values, the index uses the unique incremental identifier to enforce strict ordering.

---

## 🏎️ Performance Metrics & Evaluation

| Pagination Method | Complexity (First Page) | Complexity (Deep Pages, e.g., Page 5,000) | Data Drift Stability |
| --- | --- | --- | --- |
| **Traditional Offset** | $O(1)$ | $O(N)$ — Reads all preceding rows line-by-line | Volatile (Causes Duplicates/Skips) |
| **Sanchvex Cursor** | $O(\log N)$ | **$O(\log N)$ — Lightning fast execution** | **Bulletproof (Immutably Anchored)** |

### High-Volume Batch Seeding Execution

Executing individual sequential standard input instructions creates massive network I/O lag over the wire. Sanchvex addresses this via a multi-row query matrix loader, combining elements into high-speed array blocks.

```
[Sanchvex Seeding Engine Started]
-> Clearing any existing data from products table...
-> Generating and inserting 200000 records in chunks of 10000...
-> Successfully batch-inserted records: 50000 / 200000
-> Successfully batch-inserted records: 100000 / 200000
-> Successfully batch-inserted records: 150000 / 200000
-> Successfully batch-inserted records: 200000 / 200000
🎉 Seeding completed successfully on Sanchvex!

```

---

## 🛠️ Local Installation & Setup

Follow these steps to run the Sanchvex environment locally.

### Prerequisite Checklist

* Node.js runtime engine installed (v20+ recommended)
* A live local or cloud-hosted PostgreSQL instance (e.g., Neon.tech)

### 1. Clone the Codebase

```bash
git clone https://github.com/ashhuxt/sanchvex-backend.git
cd sanchvex-backend

```

### 2. Dependency Sourcing

```bash
npm install

```

### 3. Environment Environment Configurations

Create a `.env` file in the project's root folder:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
PORT=3000

```

### 4. Execute Dataset Hydration Seeding Script

```bash
node seed.js

```

### 5. Boot Up the Fastify Engine

```bash
node server.js

```

The server will boot up and expose the interface on your local loopback address: `http://localhost:3000/`

---

## 🧪 Automated Data Drift Validation Testing

To programmatically prove data integrity under highly volatile data conditions, run the automated integration validation script:

```bash
node test-drift.js

```

### Validation Test Log Output Proof:

```
--- Starting Sanchvex Data Drift Verification ---

[User Action] Fetching Page 1 (Limit: 5)...
Page 1 Items Received:
 -> ID: 1 | Name: Product Item 0 | Created At: 2026-06-22T17:35:36.197Z
 -> ID: 2 | Name: Product Item 1 | Created At: 2026-06-22T17:34:36.198Z
 
[System Event] Drift alert! Injecting 3 brand new items into the database...
✅ 3 new records successfully committed to Neon.

[User Action] Fetching Page 2 using the cursor token...
Page 2 Items Received:
 -> ID: 6 | Name: Product Item 5 | Created At: 2026-06-22T17:30:36.198Z
 -> ID: 7 | Name: Product Item 6 | Created At: 2026-06-22T17:29:36.198Z

🎉 VALIDATION SUCCESS: Zero duplicate items encountered!
The cursor system anchored seamlessly. Data drift handled perfectly.

```

---

## 🌐 Production API Contract Specification

### `GET /api/products`

Retrieves a list of paginated catalog data sorted by newest items first.

#### Request Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | Integer | Optional | Number of elements returned (Default: 20, Max Guardrail: 100). |
| `category` | String | Optional | Filters the dataset by a target product classification. |
| `cursor` | String | Optional | The opaque Base64 tracking string indicating the previous page boundary. |

#### Successful JSON Payload Schema (`200 OK`)

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

## 👨‍💻 Contributor Profile

* **Developer:** Ashish Patel
* **Academic Focus:** Computer Science and Engineering (3rd Year Student)
* **Contact/Review:** `siddharth@codevector.in`
