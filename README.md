<div align="center">

<pre>
██████╗ ██╗   ██╗██████╗  ██████╗ ███████╗████████╗██╗    ██╗██╗███████╗███████╗
██╔══██╗██║   ██║██╔══██╗██╔════╝ ██╔════╝╚══██╔══╝██║    ██║██║██╔════╝██╔════╝
██████╔╝██║   ██║██║  ██║██║  ███╗█████╗     ██║   ██║ █╗ ██║██║███████╗█████╗  
██╔══██╗██║   ██║██║  ██║██║   ██║██╔══╝     ██║   ██║███╗██║██║╚════██║██╔══╝  
██████╔╝╚██████╔╝██████╔╝╚██████╔╝███████╗   ██║   ╚███╔███╔╝██║███████║███████╗
╚══════╝  ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝    ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝
                            █████╗ ██╗
                           ██╔══██╗██║
                           ███████║██║
                           ██╔══██║██║
                           ██║  ██║██║
                           ╚═╝  ╚═╝╚═╝
</pre>

# 💰 BudgetWise AI

> **An Intelligent Personal Finance Assistant — dynamic monthly budget projections, recurring bills calendar, stateful AI chat auditor, and PDF/CSV statements.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-budgetwise--ai--6pqv.onrender.com-22C55E?style=for-the-badge)](https://budgetwise-ai-6pqv.onrender.com)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## 🗺️ Table of Contents

- [Overview](#-overview)
- [Architecture & Data Flow](#-architecture--data-flow)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Installation](#-local-installation)
- [Environment Variables](#-environment-variables)
- [Deploying to Render](#-deploying-to-render)
- [Docker Configuration](#-docker-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🧠 Overview

**BudgetWise AI** is a secure, personal financial intelligence application designed to eliminate manual tracking fatigue. It features an interactive react client linked to serverless backend code and LLMs:

1. **Stage 1 — Data Collection**: Incomes and expenses are logged securely. Budgets can be planned manually or instantly split using the standard 50/30/20 framework.
2. **Stage 2 — Conversational AI Auditor**: Google Gemini 2.5 Flash processes user text queries, automatically analyzes their real-time financial stats, suggests emergency savings targets, and updates active records.
3. **Stage 3 — Predictive Projections**: Simple linear math models analyze monthly spending velocity and warn users of upcoming budget overruns.

---

## 🏗️ Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                            👤  USER CLIENT                            │
│                 (Log transactions, check alerts, chat)               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  🖥️  REACT FRONTEND (Vite / SPA)                     │
│    Zustand Store · Reactive Charts · PDF Export · Bills Calendar     │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                ┌──────────────┴───────────────┐
                │ JWT Token / REST             │ POST /ai-agent
                ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────────────┐
│  🔐  SUPABASE DATABASE   │   │  ⚡  DENO EDGE FUNCTION              │
│  Postgres RLS Tables     │   │  Supabase Serverless AI Engine       │
│  income / expenses /     │   │  Injects DB values to LLM prompt     │
│  budgets / goals         │   │                                      │
└──────────────────────────┘   └───────────────┬──────────────────────┘
                                               │
                                               ▼
                               ┌──────────────────────────────────────┐
                               │  🧠  GOOGLE GEMINI 2.5 FLASH         │
                               │  Generative personal finance coach   │
                               └──────────────────────────────────────┘
```

---

## ✨ Key Features

* **💬 Stateful AI Chatbot:** Tracks chat history in the database. Recognizes conversational suffixes (e.g. `50k`, `1.5L`) and directs users through structured budget generation.
* **📅 Recurring Bills Calendar:** Monday-Sunday grid projection showing upcoming scheduled flows. Includes a browser-persisted settlement toggle to mark bills as paid.
* **📊 Exporters & PDF Generator:** Downloads printer-ready financial report dashboards as PDFs (via `html2canvas` + `jsPDF`) or exports transaction history to CSV spreadsheets.
* **📈 Real-time Category Progress:** Custom reactive hooks aggregate actual spending dynamically against active budget categories.
* **🛠️ Demo Data Seeder:** One-click dashboard tool that immediately populates the database with realistic sample transactions for quick evaluation.

---

## 📂 Project Structure

```text
├── .bolt/                  # Editor config
├── src/
│   ├── components/         # Frontend UI Components
│   │   ├── auth/           # Login / Register Split Pages
│   │   ├── bills/          # Recurring Bills Calendar Page
│   │   ├── budget/         # Budget Planner
│   │   ├── chat/           # Stateful Chatbot Page
│   │   ├── dashboard/      # Stat Cards, Recharts, and Seeding
│   │   ├── expenses/       # Log Expenses
│   │   ├── income/         # Log Income
│   │   ├── layout/         # Navigation & Sidebar
│   │   └── reports/        # Exporters & Daily Trend charts
│   ├── hooks/              # Custom React Hooks (useFinancialData)
│   ├── lib/                # Supabase Auth Client Init
│   └── store/              # Zustand global state configurations
├── supabase/
│   ├── functions/
│   │   └── ai-agent/       # AI Edge Function (Deno)
│   └── migrations/         # PostgreSQL Tables & RLS Policies
├── Dockerfile              # Multi-stage production compiler
├── nginx.conf              # Nginx web server config (SPA fallback)
└── docker-compose.yml      # Local Docker builder compose
```

---

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, Recharts, React Router v7.
* **Backend:** Supabase Edge Functions (Deno TypeScript environment).
* **Database:** PostgreSQL (with Row-Level Security policies).
* **AI API:** Google Gemini 2.5 Flash.
* **Containers:** Docker, Nginx Web Server.
* **Hosting:** Render (Frontend UI), Supabase Cloud (Database / Auth).

---

## ⚡ Prerequisites

To run this application locally, ensure you have:
* **Node.js** (v18 or higher)
* **Docker Desktop** (running in the background)
* **Google Cloud Account** (if using Gemini AI features)

---

## 💻 Local Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Gokulakrishnan064/BudgetWise-AI.git
cd BudgetWise-AI
```

#### 2. Install Node Dependencies
```bash
npm install
```

#### 3. Start Supabase Locally
```bash
npx supabase start
```
*This spins up PostgreSQL, Auth, and the Edge Function emulator on your machine. It will print your local keys.*

#### 4. Configure local environment
Create a `.env` file in the root folder and add the local credentials:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY
```

#### 5. Launch the App
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser. Register an account and click **"Load Demo Data"** to start!

---

## 🔐 Environment Variables

For production, the following variables must be configured:
* `VITE_SUPABASE_URL` (Supabase Cloud API URL)
* `VITE_SUPABASE_ANON_KEY` (Supabase anonymous public key)
* `GEMINI_API_KEY` (Your Google AI Studio key, set inside Supabase Edge Function secrets)

---

## 🚀 Deploying to Render

Render will host the Docker container for free.

1. Create a **Web Service** on **[Render.com](https://render.com)**.
2. Link your GitHub repository `Gokulakrishnan064/BudgetWise-AI` (use the public URL tab if it doesn't show in the list).
3. Set the Runtime to **Docker**.
4. Set the Instance Type to **Free**.
5. Add the following **Environment Variables / Docker Build Args** in the settings:
   * `PORT` = `80`
   * `VITE_SUPABASE_URL` = *your_production_supabase_url*
   * `VITE_SUPABASE_ANON_KEY` = *your_production_supabase_anon_key*
6. Click **Create Web Service**. 

---

## 🐳 Docker Configuration

To build and run the production web server locally inside Docker:

```bash
# Build and run using Docker Compose
docker-compose up --build -d
```
*The React app is built and served via Nginx on **`http://localhost:8080`**.*

---

## 💡 Troubleshooting

* **Blank White Page on Deploy:** Open the browser developer console. If it says *Missing Supabase environment variables*, it means you did not add the keys under the **Docker Build Args** or environment variables in Render before building. Set them and redeploy with *Clear Build Cache*.
* **Nginx 404 on Refresh:** If you reload a page like `/bills` and get a 404, check that `nginx.conf` has been successfully copied into the container `/etc/nginx/conf.d/default.conf`.
* **Chatbot returns plain default text:** Ensure you have configured the `GEMINI_API_KEY` secret inside your Supabase dashboard or via CLI (`supabase secrets set GEMINI_API_KEY=key`). If missing, the agent fallback to rule-based algorithms.
