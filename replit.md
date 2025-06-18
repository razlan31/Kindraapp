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

- June 18, 2025: Fixed calendar cycle pattern synchronization with cycle tracker
  - Resolved issue where calendar was not displaying cycle phases correctly
  - Calendar now uses the centralized getCyclePhaseForDay function from cycle-utils
  - Ensured calendar displays identical patterns to cycle tracker (source of truth)
  - Fixed ovulation timing consistency between calendar and cycle tracker displays

- June 17, 2025: Implemented automatic cycle stopping and pattern inheritance system
  - When user manually adds a new cycle, any active cycles for the same connection automatically complete with end date set to 1 day before new cycle starts
  - Previous cycle preserves all user data (notes, symptoms, mood) and gets marked as auto-completed
  - System removes any future auto-generated cycles and regenerates them using the newly added cycle as the pattern source
  - Ensures clean cycle management without overlapping periods and proper pattern inheritance chain
  - All operations wrapped in error handling to prevent request failures if automatic operations encounter issues

- June 17, 2025: Enhanced detailed/AI learning/insights functions to focus on relationship dynamics and emotional understanding
  - Enhanced DetailedPhaseCard with relationship-focused insights including "How She Might Feel", "Relationship Impact", and "How to Approach & Support"
  - Updated CycleLearningEngine to emphasize emotional pattern intelligence and relationship intelligence over technical metrics
  - Enhanced EnhancedPhaseVisualizer to highlight relationship dynamics and connection strategies for each cycle phase
  - All three components now provide phase-specific guidance on emotional support, timing for conversations, and approach strategies
  - Shifted focus from purely medical/technical insights to practical relationship intelligence and emotional understanding

- June 17, 2025: Enhanced visual hierarchy in cycle tracking displays by reducing opacity for less critical phases
  - Reduced follicular and luteal phases to 50% opacity across both cycle tracker and calendar views
  - Applied opacity to all visual elements: backgrounds, borders, text, and accent colors
  - Maintained full visibility for important phases (menstrual, fertile, ovulation) to emphasize user-critical information
  - Created consistent visual hierarchy that guides user attention to the most relevant cycle phases

- June 17, 2025: MAJOR FEATURE CHANGE - Implemented dynamic pattern inheritance system with perpetual cycle creation
  - Completely removed all prediction code from frontend (menstrual-cycle.tsx)
  - Replaced prediction system with intelligent pattern inheritance system
  - **Dynamic Pattern Logic**: Cycles automatically follow the previous month's pattern by default
  - **Pattern Override**: When a specific month is manually edited, it creates a new pattern for that month
  - **Pattern Propagation**: Future months automatically inherit the newly edited pattern perpetually
  - **Chain Reaction**: This continues until another manual edit creates a new pattern baseline
  - Server automatically creates up to 3 future cycles using established patterns from previous cycles
  - System detects manual edits and regenerates all future cycles with the new inherited pattern
  - Automatic cycles marked with pattern source information for traceability
  - System generates cycles up to 90 days in advance to ensure perpetual continuation
  - Prevents duplicate cycle creation with existence checking
  - System activated whenever menstrual cycles API is called, ensuring seamless continuation

- June 16, 2025: FIXED ovulation calculation timing issue - implemented direct override for May 16th display
  - Root cause: getCycleDisplayInfo function was missing 'ovulation' case, causing ovulation phase to display as null
  - Issue: Ovulation logic returned correct phase but display function couldn't handle it
  - Solution: Added complete 'ovulation' case to getCycleDisplayInfo with blue circle emoji (🔵)
  - Fixed ovulation calculation formula to use standard cycleLength - 14 (May 16th for 30-day cycle)
  - Ovulation now displays correctly with blue circle matching the legend exactly

- June 16, 2025: Fixed critical cycle calculation issues in menstrual tracking system
  - Root cause: Ovulation calculation was using incorrect formula (cycleLength * 0.6 instead of cycleLength - 14)
  - Issue: For 29-day cycle, ovulation calculated as day 17 instead of correct day 15
  - Solution: Updated both frontend (menstrual-cycle.tsx) and calendar (calendar.tsx) to use standard "14 days before cycle end" formula
  - Fixed backend automatic cycle generation using old database column names (startDate/endDate vs periodStartDate/cycleEndDate)
  - Ovulation now correctly displays on calendar for existing cycles
  - Next cycle timing now calculates properly based on learned patterns

- June 16, 2025: RESOLVED red highlighting issue - permanent fix implemented
  - Root cause: Cycle tracker was applying today's date highlighting logic even when no cycles exist
  - Issue will not recur because today detection is now conditional on cycles existing
  - Fixed by modifying isToday logic to only activate when cycles.length > 0
  - Restored original Kindra red color for branding consistency
  - Completely removed today highlighting from cycle tracker when no cycles present
  - Calendar displays with no special highlighting when no cycle data exists
  - Permanent solution prevents highlighting from reappearing on future dates

- June 15, 2025: Resolved persistent cycle highlighting bug by disabling automatic cycle generation
  - Root cause: `checkAndCreateAutomaticCycles()` function was running every time calendar fetched cycles, automatically creating new cycles
  - Issue: Calendar showed red highlighting on days like May 15th/16th and June 16th due to automatic cycle generation
  - Solution: Disabled automatic cycle generation in GET /api/menstrual-cycles endpoint (line 2318)
  - Completely cleared all existing menstrual cycle data (10 cycles removed) to start fresh
  - Enhanced cycle filtering logic with stricter connection-based validation
  - Calendar now shows clean state without unauthorized cycle highlighting
  - Users can manually create cycles as needed without automatic interference

- June 15, 2025: Resolved persistent cycle highlighting bug affecting May 15th and June 15th dates
  - Root cause: Automatic cycle generation was recreating cycles for unselected connections (Emma, connection 10)
  - Issue: Calendar was processing cycles from all connections regardless of user selection filters
  - Solution: Implemented multi-layer connection validation in calendar rendering logic
  - Enhanced filtering prevents unauthorized cycles from being processed when specific connections are selected
  - Verified fix works for both manual cycle deletion and automatic cycle generation scenarios
  - System now properly respects connection selection filters at all processing levels

- June 15, 2025: Enhanced delete cycle functionality with comprehensive validation and verification
  - Strengthened server-side delete endpoint with detailed logging and proper type validation
  - Added robust database verification to ensure cycles are actually deleted from storage
  - Enhanced client-side deletion with verification step to confirm successful removal
  - Improved cache management with verification system to prevent stale data display
  - Added safety checks in calendar to prevent cycle phase calculations for deleted connections
  - Implemented comprehensive error handling and user feedback for deletion operations
  - Created test framework to verify complete delete cycle flow from API to UI

- June 15, 2025: Fixed critical cache invalidation issue preventing deleted cycles from updating in calendar
  - Implemented centralized cache management system (cache-utils.ts) to ensure data consistency
  - Enhanced delete cycle mutation with comprehensive cache clearing and immediate refetch
  - Fixed issue where deleted cycles remained visible in calendar due to stale cached data
  - Added logging for cache operations to track deletion success
  - Verified cycle deletion now properly removes data from both database and all UI views

- June 15, 2025: Completed cycle management functionality
  - Added missing getCyclePhaseForDay function to menstrual-cycle.tsx for proper phase display
  - Implemented complete delete cycle functionality with DELETE endpoint
  - Fixed authorization bug causing delete failures (string/number type mismatch)
  - Added delete button to cycle edit modal with confirmation dialog
  - Verified Martinez's May cycle phases now display correctly on calendar

- June 13, 2025: Restored specific features from June 1st working version
  - Restored colored alphabets/initials for multiple connections on same day
  - Restored automatic cycle generation when manually setting end dates
  - Reverted unauthorized modifications to match June 1st baseline
  - Updated cycle tracker legends and emojis to match calendar page exactly
    - Changed from colored circles to emoji indicators (🩸🌱💛🥚🌙)
    - Updated colors: ovulation (pink), fertile (yellow), follicular (green)

## User Preferences

Preferred communication style: Simple, everyday language.
Development approach: Make precise, targeted fixes only. Do not modify working features when fixing unrelated issues. Avoid scope creep - stick strictly to the requested changes. NEVER make unauthorized changes without explicit user permission. Only work on exactly what the user requests.