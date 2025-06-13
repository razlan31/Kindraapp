# Kindra - Relationship Insights Application

## Overview

Kindra is a comprehensive relationship tracking application built with React and Express.js that helps users track, reflect, and grow their emotional connections. The application provides emotional intelligence features for relationship management, including moment tracking, badge achievements, menstrual cycle tracking, and AI-powered insights.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **UI Framework**: Shadcn/UI with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **State Management**: React Query (TanStack Query) for server state, React Context for global state
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Session-based authentication with custom auth context

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express-session with PostgreSQL session store
- **Authentication**: bcryptjs for password hashing
- **API Design**: RESTful API with JSON responses
- **File Upload**: Base64 image handling with compression utilities

### Database Schema
The application uses PostgreSQL with the following key entities:
- **Users**: Core user profiles with authentication and personal details
- **Connections**: Relationship tracking with various stages and metadata
- **Moments**: Activity/emotion tracking entries linked to connections
- **Badges**: Achievement system with unlock criteria
- **Menstrual Cycles**: Health tracking with symptoms and mood data
- **Milestones**: Relationship milestone tracking
- **Plans**: Future planning and goal setting

## Key Components

### Authentication System
- Session-based authentication using express-session
- Password hashing with bcryptjs
- Protected routes with authentication middleware
- User context provider for global auth state

### Relationship Management
- Connection tracking with relationship stages (Potential, Talking, Dating, etc.)
- Focus connection system for prioritizing main relationships
- Smart connection prioritization algorithm
- Profile images with compression and storage

### Activity Tracking
- Moment creation with emotional data and connection linking
- Multiple activity types: moments, conflicts, intimacy, plans
- Timeline view with filtering and search capabilities
- Badge system with automatic achievement unlocking

### Badge System
- Category-based achievements (Getting Started, Relationship Progress, etc.)
- Automatic badge awarding based on user activity
- Streak tracking and milestone recognition
- In-memory badge storage with database persistence issues (noted in diagnostics)

### Health Tracking
- Menstrual cycle tracking with symptoms and mood correlation
- Cycle prediction and average length calculations
- Integration with relationship emotional patterns

## Data Flow

1. **User Authentication**: Session-based login stores user data in PostgreSQL session store
2. **Connection Management**: Users create and manage relationships with various metadata
3. **Activity Logging**: Moments are created and linked to connections, triggering badge evaluations
4. **Badge Awards**: System evaluates criteria and awards badges, with notifications sent to frontend
5. **Data Persistence**: All data stored in PostgreSQL with real-time updates via React Query
6. **Image Handling**: Profile images compressed client-side and stored as base64 strings

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **drizzle-orm**: Type-safe database queries and migrations
- **@tanstack/react-query**: Server state management and caching
- **@stripe/stripe-js**: Payment processing integration
- **bcryptjs**: Password hashing and authentication
- **express-session**: Session management
- **date-fns**: Date manipulation and formatting

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette and search functionality

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with TypeScript execution via tsx
- **Database**: PostgreSQL 16 via Replit modules
- **Development Server**: Vite dev server with HMR
- **Port Configuration**: Application runs on port 5000

### Production Build
- **Frontend**: Vite build process outputs to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations for schema management
- **Deployment**: Replit autoscale deployment target

### Configuration Files
- **drizzle.config.ts**: Database migration configuration
- **vite.config.ts**: Frontend build and development configuration
- **tsconfig.json**: TypeScript compilation settings
- **tailwind.config.ts**: Styling and theme configuration

## Known Issues

Based on the badges diagnostic file, there are several areas requiring attention:

1. **Badge Persistence**: System uses in-memory storage that resets on server restart
2. **Badge Initialization**: Default badges may not be properly loaded on startup
3. **Badge Logic**: Incorrect triggering of certain achievements like "Habit Stacking Pro"
4. **Frontend Cache**: Badge display issues due to cache invalidation problems
5. **API Consistency**: Inconsistent badge response formats between endpoints

## Changelog

- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.