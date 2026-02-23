# 💸 Spendly — Smart Expense Manager

A modern, AI-powered expense tracking app built with React + Supabase.

## ✨ Features

- 📊 **Smart Dashboard** — Balance overview, income vs expense charts, recent transactions
- 💸 **Transaction Management** — Add/edit/delete with categories, payment methods & notes
- 📈 **Analytics** — Category breakdowns, payment method distribution, time-period filters
- 🎯 **Budget Planning** — Set monthly limits with alert thresholds and visual progress bars
- 🤖 **AI Insights** — Claude AI analyzes your spending and gives personalized financial advice
- 🔐 **Secure Auth** — Email/password login with Supabase Auth + Row Level Security
- 📱 **Mobile Responsive** — Full mobile layout with bottom navigation bar
- 🌙 **Dark Glassmorphism UI** — Animated gradient orbs, glass cards, smooth animations

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🌐 Deploy to GitHub Pages

This repo is pre-configured for **automatic deployment** via GitHub Actions.

1. Fork or push this repo to GitHub
2. Go to **Settings → Pages**
3. Set Source to **GitHub Actions**
4. Push to `main` branch → auto-deploys! ✅

## 🗄️ Backend

Powered by **Supabase** (already configured):
- PostgreSQL database with RLS
- Auth with email/password
- Real-time sync

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite |
| Styling | Custom CSS (Glassmorphism) |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | Claude API (claude-sonnet-4) |
| Deploy | GitHub Pages via Actions |

## 📁 Project Structure

```
spendly/
├── .github/workflows/deploy.yml  # Auto-deploy to GitHub Pages
├── src/
│   ├── App.jsx     # Main application (all pages)
│   └── App.css     # Glassmorphism styles
├── public/
│   └── 404.html   # SPA routing fix for GitHub Pages
└── index.html
```
