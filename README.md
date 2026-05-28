# 🚀 MemeVault

> **A real-time social meme aggregator and global chat platform built for modern web communities.**

MemeVault is a high-performance web application designed for seamless meme curation and community interaction. It features real-time database synchronization, dynamic user profiles, an incognito chat mode, and a robust automated moderation system.

---

## 🤖 Built with AI Collaboration
This project was proudly developed through an extensive human-AI collaboration. By leveraging the advanced reasoning and coding capabilities of top-tier AI models, MemeVault was rapidly prototyped, debugged, and deployed to production. 

Special thanks to the following AI assistants for their contributions to architecture, logic, and code generation:
* **Claude:** For deep architectural reasoning, state management structuring, and complex component logic.
* **Gemini:** For contextual problem solving, deployment strategies, and security compliance drafting.
* **Codex:** For rapid boilerplate generation, syntax formatting, and inline code completion.

---

## ✨ Core Features

* **Live Global Chat:** Real-time messaging with instant `@username` tagging and synchronized database polling.
* **Incognito Mode:** Post anonymously with custom aliases (e.g., *Anonymous Ferret*).
* **Automated Moderation:** Built-in keyword blocking, threat detection, and an automated strike/ban system to keep the community safe.
* **Dynamic User Profiles:** Secure authentication with limited-edit usernames, tracked securely via custom database limits.
* **Seamless State Management:** Instantaneous UI updates without heavy page reloads, utilizing optimized React hooks and localized caching.

---

## 🏗️ Tech Stack

* **Frontend Framework:** Next.js & React
* **Styling:** Tailwind CSS
* **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime Subscriptions)
* **Deployment & Hosting:** Vercel

---

## 🛡️ Security

MemeVault is built with modern web security practices in mind:
* **Row Level Security (RLS):** All Supabase tables are locked down via strict RLS policies to prevent unauthorized data manipulation.
* **Environment Protection:** No sensitive API keys or database passwords are hardcoded or exposed to the public repository.
* **Limit Enforcement:** Username edits and data writes are strictly throttled at the database level to prevent spam and abuse.

---

## ⚖️ Legal & Compliance

MemeVault includes built-in compliance infrastructure to ensure a safe and legal operating environment:
* **Terms of Service (ToS) & Privacy Policy:** Integrated legal agreements governing user behavior and data usage.
* **Cookie Consent:** Frontend banner tracking local storage consent to comply with standard privacy regulations.
* **DMCA Ready:** Safe Harbor attribution practices for third-party content, with a clear takedown request pipeline.

---
*Developed securely for the modern web.*
