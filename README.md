# sho.ai

An AI chatbot powered by Google Gemini API with beautiful animated backgrounds and interactive cursor effects.

## Features

- 🤖 **AI Chat Interface** - Chat with Google Gemini AI
- 🎨 **Fluid Animated Background** - Beautiful gradient animations using Framer Motion
- ✨ **Splash Cursor Effect** - Interactive ripple effects on mouse movement
- 💎 **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- ⚡ **Next.js 15** - Fast and optimized with the latest Next.js features

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shotacurtisruo/sho.ai.git
cd sho.ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/app` - Next.js app directory with pages and API routes
  - `/api/chat` - API endpoint for Gemini AI integration
- `/components` - React components
  - `/ui` - shadcn/ui components (Button, Input, Card)
  - `animated-background.tsx` - Fluid gradient background
  - `splash-cursor.tsx` - Interactive cursor effect
  - `chat-interface.tsx` - Main chat UI
- `/lib` - Utility functions

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations
- **Google Generative AI** - AI chat functionality
- **Lucide React** - Icons

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Don't forget to add your `GEMINI_API_KEY` environment variable in the Vercel project settings!

## License

MIT
