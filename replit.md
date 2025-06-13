# Kindra - Relationship Insights Application

## Overview

Kindra is a comprehensive relationship tracking application built with React and Express.js. It helps users track, reflect, and grow their emotional connections through features like moment tracking, AI-powered insights, badges, and relationship analytics. The app focuses on emotional intelligence and provides tools for understanding relationship patterns and dynamics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with shadcn/ui styling
- **State Management**: React Query (TanStack Query) for server state, React Context for global state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with Google OAuth and session-based auth
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **File Structure**: Modular architecture with separate route handlers

### Key Design Decisions
- **Monorepo Structure**: Client and server code in same repository with shared types
- **Type Safety**: Shared schema definitions between frontend and backend
- **Real-time Features**: Built-in preparation for WebSocket connections
- **Responsive Design**: Mobile-first approach with bottom navigation

## Key Components

### Core Features
1. **Connection Management**: Track relationships across different stages (Potential, Talking, Dating, etc.)
2. **Moment Tracking**: Record relationship moments with emotions, tags, and context
3. **AI Insights**: OpenAI-powered relationship coaching and advice
4. **Badge System**: Gamification through achievement badges
5. **Cycle Tracking**: Menstrual cycle tracking with mood correlations
6. **Calendar Integration**: Timeline view of relationship events

### User Experience
- **Onboarding Flow**: Multi-step user setup with profile configuration
- **Dashboard**: Central hub showing key metrics and recent activity
- **Modal System**: Centralized modal management for forms and details
- **Theme Support**: Dark/light mode with system preference detection

### Authentication System
- **Google OAuth**: Primary authentication method
- **Session Management**: Persistent sessions with PostgreSQL storage
- **User Profiles**: Extended user data including zodiac signs, love languages

## Data Flow

### Database Schema
- **Users**: Core user profiles with OAuth integration
- **Connections**: Relationship entities with stages and metadata
- **Moments**: Timestamped relationship events with emotional context
- **Badges**: Achievement system with unlock criteria
- **Menstrual Cycles**: Health tracking integration
- **Notifications**: In-app notification system

### State Management
- **Server State**: React Query handles API calls, caching, and synchronization
- **Client State**: React Context for authentication, modals, and relationship focus
- **Local Storage**: Persistent UI preferences and temporary data

### API Structure
- **RESTful Endpoints**: Standard CRUD operations for all entities
- **Authentication Middleware**: Protected routes with session validation
- **Error Handling**: Consistent error responses with proper HTTP status codes

## External Dependencies

### Core Libraries
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Authentication**: Passport.js with Google OAuth strategy
- **AI Integration**: OpenAI API for relationship insights
- **UI Framework**: Radix UI primitives with Tailwind CSS
- **Date Handling**: date-fns for date manipulation and formatting

### Development Tools
- **TypeScript**: Full type safety across the stack
- **ESBuild**: Fast production builds
- **Vite**: Development server with hot reloading

### Third-Party Services
- **Stripe**: Payment processing for premium features
- **OpenAI**: AI-powered relationship coaching
- **Google OAuth**: User authentication

## Deployment Strategy

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Process Management**: npm scripts for development and production
- **Port Configuration**: Port 5000 mapped to external port 80

### Environment Variables
- **Database**: DATABASE_URL for PostgreSQL connection
- **Authentication**: Google OAuth credentials and session secrets
- **External APIs**: OpenAI and Stripe API keys

### Known Issues
The badges system currently has several issues that need attention:
- Badge storage uses in-memory storage that resets on server restart
- Badge initialization may not be called properly on startup
- Badge award logic has issues with streak calculations
- Frontend cache invalidation prevents badges from displaying correctly
- Inconsistent badge response formats between endpoints

## Changelog

- June 13, 2025: Restored specific features from June 1st working version
  - Restored colored alphabets/initials for multiple connections on same day
  - Restored automatic cycle generation when manually setting end dates
  - Restored "Begin New Cycle" card in list view
  - Removed unwanted automatic cycle creation during page loads
  - Maintained June 1st layout and behavior

## User Preferences

Preferred communication style: Simple, everyday language.
Development approach: Make precise, targeted fixes only. Do not modify working features when fixing unrelated issues. Avoid scope creep - stick strictly to the requested changes.