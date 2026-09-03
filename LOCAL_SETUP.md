# Marketplace - Local Setup Guide

Please follow the instructions sequentially.

---

## 1. Prerequisites
Before cloning the repository, ensure your environment meets the following requirements:
*   **Node.js**: Version 18.17.0 or higher (v20+ recommended).
*   **Package Manager**: `npm` (Node Package Manager).

You can verify your installations by running:
```bash
node -v
npm -v
```

## 2. Installation
Open your terminal, clone the repository, and install the required dependencies:

```bash
# 1. Clone the repository
git clone https://github.com/zivedri417/marketplace.git

# 2. Navigate into the project directory
cd marketplace

# 3. Install the dependencies using npm
npm install
```

## 3. Environment Variables
This project relies on environment variables to connect the Next.js frontend to the managed backend infrastructure (Supabase).

In the root of the `marketplace` directory, create a new file named `.env.local`. 

You must populate it with the following keys:

```env
# Supabase Public Keys (Required for Authentication & Client-side fetching)
NEXT_PUBLIC_SUPABASE_URL="<Provided_by_Student>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<Provided_by_Student>"

# Supabase Admin Key (Required for server-side Auction resolving and cleanup)
SUPABASE_SERVICE_ROLE_KEY="<Provided_by_Student>"


```

**Note for Graders:** Since this repository does not expose secure backend keys publicly, the student submitting this assignment should provide you with a `.env` file or a secure copy of these exact keys. If an `.env.example` file was provided in the submission zip, you can simply rename it to `.env.local` and use it.

## 4. Running the App
Once your `.env.local` file is saved and dependencies are installed, you can start the development server.

Run the following command in the root directory:
```bash
npm run dev
```

*   The terminal will indicate that the server has started successfully.
*   Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)** to view the application.

## 5. Database & Infrastructure Note
**You do not need to install PostgreSQL or run Docker locally to grade this assignment.**

This application utilizes a modern serverless architecture. The entire database (PostgreSQL), authentication layer, and file storage (images) are fully managed via a remote **Supabase** instance. As long as your `.env.local` keys are correct and you have an active internet connection, the local Next.js frontend will communicate directly with the live staging database seamlessly.
