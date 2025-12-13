# FixedPronos - Plateforme de Pronostics Sportifs

## Overview
FixedPronos is a VIP sports prediction platform featuring a subscription and referral system. It utilizes React/TypeScript for the frontend and Supabase for authentication and database management. The platform is 100% functional, including automated Mobile Money payments via MoneyFusion, and provides a dual-field system for categorizing bets and controlling access. Its core purpose is to offer sports predictions, manage user subscriptions, and facilitate payments, aiming for a robust and user-friendly experience in the sports betting market.

## User Preferences
- Langue: Français
- Framework: React + TypeScript + Vite
- UI: Shadcn + Tailwind CSS
- Theme: Sombre avec accents dorés/jaunes

## System Architecture

### UI/UX Decisions
The application uses Shadcn UI components built with Radix UI and Tailwind CSS, following a dark theme with gold/yellow accents. Navigation includes a fixed bottom bar for mobile viewing, featuring sections like Pronos, Combos, Offers, and Account.

### Technical Implementations
- **Frontend**: React 18 with TypeScript and Vite.
- **Routing**: React Router v6.
- **State Management**: TanStack Query (React Query).
- **Styling**: Tailwind CSS with a customized theme.
- **Authentication**: Supabase Authentication, with Row Level Security (RLS) enabled on all tables and automatic profile creation on signup. A role system (user/admin) is managed via the `user_roles` table.
- **Database**: Supabase, structured with key tables for `profiles`, `user_roles`, `subscriptions`, `pronos`, `transactions`, `referrals`, `payments`, and `combos`.
- **API Services**: All API calls are directed through `src/lib/supabase-services.ts`, abstracting interactions with Supabase for pronos, user management, payments, and admin functions.
- **Dual-Field System for Predictions**: Predictions are categorized by `prono_type` (e.g., safe, risk, vip) for risk assessment and `access_tier` (e.g., free, basic, pro, vip) for subscription-based content control. This system provides multi-level protection on both the frontend (filtering, blocking access, displaying reserved content messages) and the admin panel (independent selectors for type and tier).
- **Automated Subscription Activation**: An intelligent system extends existing subscriptions, creates new ones, or reactivates expired ones based on payment approval, preserving remaining subscription time.
- **Automated Mobile Money Payments**: **PRODUCTION-READY** integration with MoneyFusion API for automatic payments (Orange Money, MTN Mobile Money, Moov Money). Implementation includes:
  - Vercel serverless function (`/api/payment/initiate-moneyfusion.ts`) for secure payment initiation
  - Webhook handler (`/api/webhooks/moneyfusion.ts`) for real-time payment notifications
  - Automatic subscription activation on payment confirmation
  - Support for all MoneyFusion webhook events (pending/completed/cancelled)
  - Secure API credentials stored in environment variables (never exposed to frontend)
  - Test credentials configured: API URL = https://www.pay.moneyfusion.net/fixedapp/53c47152846ca6e2/pay/

### Feature Specifications
- **Combined Bets (Combos)**: Supports combined bets with image coupons, linked pronos, and CRUD operations via Supabase services. Filtering by subscription level is intended.
- **Admin Panel**: Comprehensive interface for managing users, predictions, subscriptions, and approving payments.
- **Referral System**: Integrated referral program with commission tracking.
- **Push Notifications**: Web push notification system to notify users when new pronos are posted. Implementation includes:
  - Service worker (`public/sw.js`) for handling push events
  - Backend endpoints for subscription management (`/api/push/subscribe`, `/api/push/unsubscribe`)
  - VAPID key authentication for secure push delivery
  - Automatic notification sending when new pronos are published via AI
  - NotificationBell UI component in header for subscription management
  - Database persistence for push subscriptions (`push_subscriptions` table)

## External Dependencies
- **Supabase**: Used for authentication, real-time database, storage, and serverless functions (replacing a traditional backend API).
- **MoneyFusion API**: Integrated for automated Mobile Money payment processing in African markets (Orange Money, MTN Mobile Money, Moov Money).
- **Vercel**: Recommended for production deployment (mentioned in `DEPLOYMENT.md`).