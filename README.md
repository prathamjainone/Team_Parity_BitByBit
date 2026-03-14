# ⚡ Parity 
**The End of the Trust Gap.** 

An autonomous freelance escrow platform built for the Spectral Bridge Hackathon. Parity brings absolute certainty to freelance work by using AI to objectively define project scope, autonomously verify code submissions, and release funds dynamically through programmatic escrow — freeing employers and freelancers to focus on building.

**🚀 Live Demo:** [Vercel Deployment Link ](https://team-parity-bit-by-bit.vercel.app/)

---

## 🌟 The Problem

The traditional freelance process is broken:
- **Employers** face vague deliverables, blown budgets, and subpar code quality.
- **Freelancers** struggle with scope creep, delayed milestone payouts, and subjective client disputes.

## 🔥 The Solution: The 3 Pillars of Parity

1. **Intelligent Intake & AI Roadmaps (Decomposition)**
   Employers provide a raw, unstructured description of their vision. The Parity AI Agent instantly translates this into strict, verifiable milestones, complete with dollar-value payouts attached to specific deliverables.
2. **Automated QA (AQA)**
   Once a freelancer accepts an open project from the marketplace, they submit their work (GitHub PRs, deployed links) against the active milestone. The AQA LLM objectively evaluates the submission against the agreed-upon deliverables.
3. **Immutable Escrow & Dynamic PFI**
   Funds flow securely via micro-transactions. When the AQA Agent approves the work (Verdicts: APPROVED, PARTIAL, UNMET), the escrow automatically releases funds to the freelancer's wallet. Parity also updates the **PFI (Platform Freelancer Index) Score** — a unified reputation metric that prevents ghosting and enforces high quality.

---

## 🚀 Features

- **Role-Based Workspaces**: Distinct dashboards for Employers and Freelancers.
- **Open Project Marketplace**: Freelancers can seamlessly browse and claim funded, open contracts.
- **AI-Generated Escrow Contracts**: Auto-generated deliverables, deadlines, and smart pricing.
- **Instant AI Verification**: No more client ghosting. Submit a link, get verified, and get paid instantly.
- **Dashboard UI**: Stunning dark-mode interface with glassmorphism, animated tracking, and live wallet/PFI updates.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **AI Integration**: Custom Language Models for roadmap decomposition and automated code verification (AQA).

---

## 💻 Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Team_Parity_BitByBit/agent-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🗄️ Database Architecture

Parity utilizes Supabase Postgres with specialized RLS policies. It includes automatic trigger functions (`public.handle_new_user()`) that instantly mirror authenticated users into a `public.users` table with default `wallet_balance` ($10,000 for employers, $0 for freelancers) and tracking `pfi_score`. Projects flow through `OPEN`, `IN_PROGRESS`, and `COMPLETED` statuses based on marketplace activity.

---
Built by Team Parity.
