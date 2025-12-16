# Frontend Setup Guide (Beginner Friendly)

This guide will help you set up and run the **Rentverse Frontend** step by step.

---

## Prerequisites

Before starting, make sure you have one of these installed on your computer:

| Package Manager | Download Link |
|-----------------|---------------|
| **Node.js** (v18+) | [https://nodejs.org](https://nodejs.org) |
| **Bun** (recommended) | [https://bun.sh](https://bun.sh) |

> **Tip:** To check if you have them installed, open your terminal and run:
> ```bash
> node -v    # Check Node.js version
> bun -v     # Check Bun version
> ```

---

## Step 1: Navigate to the Frontend Directory

Open your terminal and navigate to the frontend folder:

```bash
cd rentverse-frontend
```

---

## Step 2: Install Dependencies

Choose **one** of the following methods:

### Option A: Using Bun (Faster)
```bash
bun install
```

### Option B: Using npm
```bash
npm install
```

### Option C: Using yarn
```bash
yarn install
```

This will download all the required packages for the project.

---

## Step 3: Run the Development Server

Start the app in development mode:

### Using Bun
```bash
bun dev
```

### Using npm
```bash
npm run dev
```

### Using yarn
```bash
yarn dev
```

---

## Step 4: Open in Browser

Once the server starts, open your browser and go to:

```
http://localhost:3000
```

You should see the Rentverse application running!

---

## Available Commands

| Command | Description |
|---------|-------------|
| `bun dev` or `npm run dev` | Start development server |
| `bun run build` or `npm run build` | Build for production |
| `bun start` or `npm start` | Run production build |
| `bun run lint` or `npm run lint` | Check code for errors |

---

## Project Structure (Quick Overview)

```
rentverse-frontend/
├── app/              # Pages and routes
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── stores/           # State management (Zustand)
├── types/            # TypeScript types
├── utils/            # Helper functions
├── views/            # Page views/layouts
├── data/             # Static data
├── public/           # Static assets (images, etc.)
└── package.json      # Project dependencies
```

---

## Tech Stack

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Zustand** - State management
- **MapTiler SDK** - Maps integration

---

## Troubleshooting

### "Command not found" error
- Make sure Node.js or Bun is installed properly
- Try restarting your terminal

### Port 3000 already in use
- Another app is using port 3000
- Stop the other app, or run on a different port:
  ```bash
  npm run dev -- -p 3001
  ```

### Dependencies failed to install
- Delete `node_modules` folder and try again:
  ```bash
  rm -rf node_modules
  npm install
  ```

---

## Need Help?

- Check the main [README.md](./README.md) for more details
- Look at [HOW-TO-USE.md](./HOW-TO-USE.md) for usage guide
- Review [FEATURES.md](./FEATURES.md) for feature documentation

---

Happy coding!
