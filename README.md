# Student Expense Tracker

A web app for tracking expenses with budgets, categories, and analytics. Built because spreadsheets are boring.

## What it does

- Track your expenses with categories
- Set monthly budgets and see if you're overspending
- Category-specific budgets (because you know you spend too much on food)
- Charts and analytics to visualize where your money goes
- Dark mode (obviously)
- Real-time updates with Firebase

## Tech Stack

- Next.js 13 (App Router)
- Firebase (Auth + Firestore)
- TypeScript
- Tailwind CSS
- Recharts for graphs
- Framer Motion for animations

## Setup

Clone and install:

```bash
npm install
```

Create a `.env.local` file with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Run the dev server:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000)

## Features

**Dashboard**
- Monthly budget overview with progress bars
- Category-wise spending breakdown
- Daily average vs budget allowance
- Recent transactions list

**Budget Management**
- Set overall monthly budget
- Category-specific budgets
- Visual indicators when you're close to limits

**Analytics**
- Spending trends over time
- Category breakdown pie chart
- Monthly comparison charts

**Categories**
- Create custom categories with colors
- Edit or delete categories
- Default categories included

## Project Structure

```
app/
  ├── dashboard/        # Main dashboard
  ├── add-expense/      # Add new expense
  ├── edit-expense/     # Edit existing expense
  └── login/            # Auth page
components/             # Reusable components
context/                # React context (Auth, Dark Mode)
firebase/               # Firebase config
lib/                    # Firestore helpers
types/                  # TypeScript types
```

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Add your config to `.env.local`
5. Deploy Firestore rules from `firestore.rules`

## License

Do whatever you want with it.
