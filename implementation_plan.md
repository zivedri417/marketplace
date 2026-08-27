# Technical Design and Architectural Blueprint: Marketplace App

This document serves as the foundational architectural blueprint for the marketplace web application. It outlines the system architecture, database schema, directory structure, core abstractions, and security foundations, utilizing Next.js (TypeScript), Supabase, and Vercel.

## User Review Required

> [!IMPORTANT]
> Please review this architecture proposal to ensure it aligns with your vision for the marketplace. Pay special attention to the Database Schema and Directory Structure, as these will be the foundation of our development.
> Once approved, this plan will be used to initialize the project and begin implementation.

## Open Questions

> [!WARNING]
> To refine the design, please clarify the following points:
> 1. **Messaging/Contacting:** Will users communicate via an in-app real-time chat, or simply via a contact form that sends an email?
> 2. **Transactions/Payments:** Are we handling actual payments on the platform (e.g., via Stripe integration) or is it just a listing platform where users arrange payments off-site?
> 3. **Image Hosting:** Will product images be stored using Supabase Storage? (Highly recommended since we are using Supabase for the database).

---

## 1. System Architecture Proposal

The application will follow a modern Serverless architecture optimized for performance and scalability.

*   **Frontend & API (Next.js):** 
    *   Using the Next.js App Router for React Server Components (RSC).
    *   RSC will be used for fetching data directly on the server, reducing the amount of JavaScript sent to the client and improving SEO (crucial for a marketplace).
    *   Interactive components (e.g., forms, UI states) will be Client Components.
    *   Next.js Server Actions will handle form submissions and data mutations directly from the client without needing dedicated API routes in most cases.
*   **Database & Authentication (Supabase):**
    *   **PostgreSQL Database:** Relational database for structured data.
    *   **Supabase Auth:** Handles user registration, login, and session management. Integrates deeply with Postgres Row Level Security (RLS).
    *   **Supabase Storage:** For hosting product images and user avatars.
*   **Deployment (Vercel):**
    *   Next.js natively deploys to Vercel, offering edge caching, preview deployments, and seamless CI/CD.
*   **Data Flow:**
    *   **Read:** Client navigates to a page -> Server Component fetches data directly from Supabase via `@supabase/ssr` -> HTML is rendered and sent to the client.
    *   **Write:** Client interacts with a form -> Next.js Server Action is invoked -> Server Action validates input (Zod) -> Performs Supabase mutation -> `revalidatePath` to clear Next.js cache and update UI.

---

## 2. Database Schema (Supabase PostgreSQL)

Here are the core entities and relationships.

### `users` (Managed via Supabase Auth + Public Profile Table)
Supabase handles the auth in the `auth.users` schema. We will have a public `profiles` table that references it.
*   `id` (UUID, Primary Key, References `auth.users.id`)
*   `full_name` (Text)
*   `avatar_url` (Text, Nullable)
*   `bio` (Text, Nullable)
*   `created_at` (Timestamp)

### `products`
Items listed for sale.
*   `id` (UUID, Primary Key)
*   `seller_id` (UUID, References `profiles.id`)
*   `title` (Text)
*   `description` (Text)
*   `price` (Numeric)
*   `status` (Enum: 'AVAILABLE', 'SOLD', 'RESERVED')
*   `images` (Array of Text - URLs to Supabase Storage)
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)

### `conversations` (For in-app messaging)
Represents a chat thread between a buyer and a seller regarding a specific product.
*   `id` (UUID, Primary Key)
*   `product_id` (UUID, References `products.id`)
*   `buyer_id` (UUID, References `profiles.id`)
*   `seller_id` (UUID, References `profiles.id`)
*   `created_at` (Timestamp)

### `messages`
Individual messages within a conversation.
*   `id` (UUID, Primary Key)
*   `conversation_id` (UUID, References `conversations.id`)
*   `sender_id` (UUID, References `profiles.id`)
*   `content` (Text)
*   `created_at` (Timestamp)

---

## 3. Directory Structure

A scalable folder structure utilizing the Next.js App Router and feature-based organization.

```text
/
├── public/                 # Static assets (fonts, icons, etc.)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (auth)/         # Auth routes (login, register)
│   │   ├── products/       # Product listings (e.g., /products/[id])
│   │   ├── profile/        # User profile and dashboard
│   │   ├── api/            # Route handlers (if Server Actions aren't enough)
│   │   ├── layout.tsx      # Root layout (Providers, Navbar, Footer)
│   │   └── page.tsx        # Landing page (Hero, Featured Products)
│   ├── components/         # Reusable UI components (shadcn/ui or custom)
│   │   ├── ui/             # Generic atomic components (Button, Input)
│   │   └── shared/         # Domain-agnostic complex components (Navbar, Modal)
│   ├── features/           # Feature-based domains (Domain-Driven Design)
│   │   ├── auth/           # Auth components, actions, schemas
│   │   ├── products/       # Product cards, forms, actions, schemas
│   │   └── messaging/      # Chat UI, real-time hooks
│   ├── lib/                # Core configurations and utilities
│   │   ├── supabase/       # Supabase client initialization (server & client)
│   │   ├── utils.ts        # Helper functions (e.g., cn for tailwind)
│   │   └── constants.ts    # App-wide constants
│   ├── hooks/              # Custom React hooks
│   └── types/              # Global TypeScript interfaces/types (Database generated types)
├── .env.local              # Environment variables
├── middleware.ts           # Next.js middleware (Auth protection, routing)
└── tailwind.config.ts      # Tailwind CSS configuration
```

---

## 4. Core Technical Abstraction

### State Management
*   **Server State:** Next.js App Router native fetching and caching mechanisms. Data is fetched on the server and passed as props.
*   **Client State:** React `useState` and `useReducer` for localized UI state (e.g., modal visibility, form input).
*   **Global Client State:** React Context for truly global state like active theme or complex auth states (though Supabase session handles most auth state). Avoid heavy libraries like Redux unless absolutely necessary.

### CRUD Operations & Server Actions
All data mutations will occur via Next.js Server Actions to ensure type safety and security without exposing API endpoints.

```typescript
// Example: src/features/products/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  // 1. Validate input (using Zod)
  // 2. Authenticate user
  // 3. Insert into Supabase
  // 4. Handle Errors
  // 5. revalidatePath('/products')
}
```

### Error Handling & Input Validation
*   **Validation:** Use **Zod** to define schemas for all inputs (forms and server actions). Zod integrates seamlessly with React Hook Form on the client and Server Actions on the backend.
*   **Error Handling:** Use `error.tsx` boundaries in Next.js to catch rendering errors gracefully. Server Actions will return discriminated unions for success/error states (e.g., `{ success: true, data: ... } | { success: false, error: string }`).

---

## 5. Security & Scaling Foundations

### Authentication & Authorization
*   **Supabase Auth:** Leveraged for secure JWT-based authentication.
*   **Next.js Middleware:** `middleware.ts` will intercept requests to protected routes (e.g., `/profile`, `/products/new`) and redirect unauthenticated users to `/login`.
*   **Row Level Security (RLS):** This is the core of our authorization. We will write SQL policies in Supabase to ensure users can only access their data.
    *   *Example RLS:* `products` table allows `SELECT` for everyone, but `UPDATE` and `DELETE` only if `auth.uid() == seller_id`.

### Data Protection
*   All environment variables (Supabase URL, Anon Key, Service Role Key) must be strictly managed. Never expose the Service Role key to the client.
*   Use Next.js Server Actions to ensure sensitive operations execute securely on the server.

### Scaling Considerations
*   **Database Indexing:** Create indexes on frequently queried columns, such as `seller_id` on the `products` table, or `status` to quickly fetch available items.
*   **Pagination / Infinite Scroll:** Fetching all products at once will crash the app. We will implement cursor-based or offset pagination via Supabase's `range()` and Next.js query parameters or infinite scroll hooks.
*   **Caching:** Utilize Next.js Data Cache to heavily cache public pages (like the homepage or a specific product page) and revalidate only when a mutation occurs.

---

## Verification Plan

### Automated Tests (Future Consideration)
*   **Unit Tests (Vitest):** To test pure utility functions and complex React hooks.
*   **Component Tests (React Testing Library):** To ensure critical UI components render correctly.
*   **E2E Tests (Playwright):** To simulate user flows like "Sign Up -> Create Listing -> View Listing".

### Immediate Next Steps (Manual Verification)
1. Initialize Next.js project with Tailwind CSS.
2. Setup Supabase project and apply the initial Database Schema and RLS policies.
3. Configure `@supabase/ssr` for Next.js App Router authentication.
4. Verify user registration and login flows manually.
