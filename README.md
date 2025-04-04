# Ball Talk App

A professional-grade Digital Audio Workstation (DAW) designed specifically for athletes to create, share, and monetize audio content.

## Features

- **Enhanced Audio Studio**: Professional-grade 24-bit/48kHz audio processing with real-time waveform visualization
- **Advanced Mastering Chain**: Professional-grade audio effects including EQ, compression, and limiting
- **Multi-track Recording**: Layered recording functionality with precise BPM synchronization
- **AI-Generated Tracks**: Create background tracks with AI assistance
- **Library Management**: Organize and access your audio content
- **Earnings Dashboard**: Track revenue from streams, downloads, and subscriptions
- **Subscription Plans**: Monetize your content with flexible subscription options

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Audio Processing**: Tone.js, Web Audio API
- **State Management**: React Context, TanStack Query
- **Authentication**: Passport.js with session-based auth

## Getting Started

### Prerequisites

- Node.js v18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/durellwilson/balltalkappbeta.git
   cd balltalkappbeta
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=your_postgres_connection_string
   OPENAI_API_KEY=your_openai_api_key (optional, for AI features)
   ```

4. Push database schema:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

## Project Structure

- `client/`: Frontend React application
  - `src/components/`: Reusable UI components
  - `src/pages/`: Application routes and page components
  - `src/hooks/`: Custom React hooks
  - `src/lib/`: Utility functions and shared logic
  - `src/context/`: React Context providers

- `server/`: Backend Express application
  - `routes.ts`: API route definitions
  - `auth.ts`: Authentication logic
  - `db.ts`: Database connection

- `shared/`: Code shared between frontend and backend
  - `schema.ts`: Database schema definitions

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build the application for production
- `npm run db:push`: Push schema changes to the database

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.