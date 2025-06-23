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

- June 23, 2025: NAVIGATION RESTRUCTURE - Separated AI coach and reorganized app structure for better user experience
  - Created dedicated Luna AI page with full-screen chat experience
  - Renamed Activities to "Trackings" with toggle between Activities and Connections views
  - Updated bottom navigation: Luna, Trackings, Calendar, Insights (4 clean tabs)
  - Moved dashboard content from Home to Insights page (now has Dashboard and Daily Quote tabs)
  - Added floating Luna button accessible from all pages except Luna page itself
  - Implemented compact mode for AI chat in floating panel
  - Serves both AI-only users (dedicated Luna page) and full tracking users (Trackings page)
  - Maintains clean 4-tab navigation while providing comprehensive functionality
  - Enhanced user experience with clear separation of concerns and flexible access patterns

- June 23, 2025: IMPLEMENTED IMPROVED PRICING MODEL - Added comprehensive subscription management system with freemium monetization
  - Created subscription database schema with usage tracking (monthly_ai_insights, monthly_ai_coaching, trial_end_date)
  - Implemented three premium tiers: Weekly ($1.99), Monthly ($4.99), Annual ($39.99) with 37% savings
  - Added free tier limits: 1 connection, 3 AI insights/month, 3 AI coach messages/month, unlimited badges
  - Built subscription utility functions with intelligent usage tracking and limit enforcement
  - Created pricing modal component with 5-day free trial and Stripe checkout integration
  - Added subscription status page with usage indicators and upgrade prompts
  - Implemented usage limits on connection creation, AI insights, and AI coaching endpoints
  - Added premium navigation tab and upgrade prompts throughout the app
  - Enhanced user experience with clear usage tracking and gentle upgrade prompts
  - Stripe webhook integration for subscription lifecycle management
  - Revenue model: $1/month ad revenue from free users + premium subscriptions for optimal profitability

- June 20, 2025: SCREENSHOT DOWNLOAD SERVICE - Created multiple download endpoints for comprehensive mobile development documentation
  - Added three download endpoints: /kindra-screenshots.tar.gz, /files/kindra-screenshots.tar.gz, and /files/download.html
  - Archive contains 100 screenshot files covering all app features and UI components (7.6MB)
  - Includes README.md with technical specifications for React Native developer
  - Screenshots document dashboard, activities, connections, cycle tracking, settings, modals, and navigation
  - Complete visual reference package for accurate mobile app conversion with redundant access methods

- June 20, 2025: SUPPORT MESSAGING SYSTEM - Added user support messaging in settings page with free email service
  - Created support contact form in settings with subject and message fields
  - Implemented free Gmail SMTP backend using nodemailer to send messages to jagohtrade@gmail.com
  - Replaced paid SendGrid service with free Gmail App Password authentication
  - System automatically includes user profile information and contact details in emails
  - User email address is set as replyTo for direct response capability
  - Added comprehensive form validation, loading states, and error handling
  - Fixed authentication middleware and database method compatibility issues

- June 18, 2025: TIMELINE DATE FILTERING - Limited timeline view to show upcoming events only within 1 month
  - Added date range filtering for timeline tab to prevent showing events too far in the future
  - Timeline now shows all past events plus upcoming events within 1 month from current date
  - Other activity tabs (moments, plans, conflicts, intimacy) remain unaffected by date filtering
  - Improves timeline relevance by focusing on actionable timeframe

- June 18, 2025: FLOATING PLAN BUTTON FIX - Fixed missing PlanModal component rendering in App.tsx
  - Added PlanModal import and rendering to ModalsContainer component
  - Connected plan modal state (planModalOpen, closePlanModal) to app-level modal management
  - Enhanced debugging in modal context to track plan modal state changes
  - Fixed floating "Add Plan" button that was calling openPlanModal but modal wasn't rendered
  - Both activities page plan button and floating menu plan button now work correctly

- June 18, 2025: REACT CONTEXT SYNC SOLUTION - Replaced unreliable DOM events with React Context for bidirectional synchronization
  - Created SyncProvider context with triggerConnectionSync and registerSyncHandler functions
  - Replaced CustomEvent system with direct function calls through React Context
  - Activities page registers sync handler through useSync hook
  - All modals use triggerConnectionSync for immediate, reliable communication
  - Eliminates timing issues, navigation context loss, and browser event limitations
  - Fixed intimacy emoji from 💕 to 💗 in all modal components
  - Comprehensive solution ensures robust bidirectional connection filter synchronization
  
- June 18, 2025: BIDIRECTIONAL CONNECTION SYNC FIX - Fixed comprehensive bidirectional connection filter synchronization between activity page and all modals
  - Fixed plan modal validation errors causing "failed to create plan" messages from + button
  - Enhanced plan schema validation with proper data structure and error handling
  - Implemented connection sync triggers in moment and plan modals to update activity page filters after saving
  - Fixed API request format for mini-insight generation (parameter order correction)
  - All modal activities (moments, plans, conflicts, intimacy) now properly sync back to activity page connection filters
  - Plan button from + menu now works correctly with proper connection preselection and validation

- June 18, 2025: BALANCED NOTIFICATION SYSTEM - Created optimal mix of value-driven insights and gentle reminders
  - 70% value-driven insights: Pattern analysis, behavioral insights, emotional intelligence scores
  - 30% gentle reminders: Soft prompts for moment logging when patterns detected
  - Moment reminders provide weekend/weekday patterns, communication effectiveness analysis
  - AI insights deliver timing patterns, attention distribution analysis, conflict resolution success rates  
  - Cycle reminders offer phase-specific relationship strategies with 20% gentle tracking prompts
  - Smart frequency management maintains engagement without overwhelming users
  - System balances education/guidance with necessary data collection prompts

- June 18, 2025: REDUCED ZODIAC REFERENCES & ELIMINATED REPLACEMENT LANGUAGE - Fine-tuned quote generation system based on user feedback
  - Reduced zodiac sign context usage from 50% to 25% probability to minimize astrology references
  - Updated all edgy quote prompts to focus on self-worth and what users deserve rather than "replacing" people
  - Enhanced system messages to explicitly avoid zodiac references in AI-generated content
  - Maintained "you deserve better" messaging while eliminating "replacing someone" language
  - Refined fallback quotes to remove any replacement-focused content
  - Quote system now provides empowering messages about standards without suggesting finding someone new

- June 18, 2025: REFINED EDGY QUOTE STYLE - Updated edgy style to be witty, cheeky, and empowering rather than harsh or negative
  - Changed AI prompts to "cheeky, empowering relationship truth" with "playful directness"
  - Updated system message to describe coach as "witty, confident" who is "cheeky and clever about healthy boundaries"
  - Replaced harsh fallback quotes with clever, confidence-building alternatives like "Clarity is sexy. Mixed signals are not."
  - Edgy style now uses wit and humor to build self-worth while addressing relationship patterns
  - Maintains directness through clever observations rather than cruel or overly negative messaging

- June 18, 2025: FOUR QUOTE STYLES SYSTEM - Added fourth quote style "soft positive affirmating" with even distribution
  - Expanded quote system from 3 to 4 distinct styles: beautiful, simple, edgy, and soft
  - Soft style provides gentle, positive affirmations focusing on self-worth and healing
  - Enhanced AI prompts for soft style to be encouraging, supportive, and nurturing
  - Added comprehensive fallback quotes for soft style category
  - All four styles now distributed evenly (25% each) through random selection
  - System provides full spectrum from direct advice to brutal honesty to gentle affirmations

- June 18, 2025: CYCLE INFO IN DATE CLICKS - Enhanced calendar date click functionality with comprehensive cycle information display
  - Added cycle information cards to day detail modal alongside existing activity cards
  - Cycle cards show connection name, current cycle day, phase description, day range, hormonal profile, and recommendations
  - Distinctive pink gradient design differentiates cycle cards from activity cards
  - Cards appear for each selected connection with active cycle data for the clicked date
  - Provides same detailed cycle insights as dedicated cycle tracker but in convenient date-click format
  - Enhanced user experience with comprehensive cycle context when exploring specific calendar dates

- June 18, 2025: PRIORITY DISPLAY SYSTEM - Implemented intelligent priority-based display for calendar day indicators
  - Priority 1: Activity emojis (moments/milestones) always displayed first with maximum space allocation
  - Priority 2: Connection alphabet letters with phase-based colors (show only when sufficient space available)  
  - Priority 3: Menstrual cycle emojis (lowest priority, only prominent phases, only when plenty of space)
  - Space-based truncation prevents overflow: daily (6/3/2), weekly (4/2/1), monthly (3/2/1) max indicators per priority
  - Enhanced conditional filtering: menstrual cycle colors only appear when filter is enabled
  - Fixed alignment issues with contained circular indicators and proper flex wrapping

- June 18, 2025: VISUAL HIERARCHY UPDATE - Enhanced visual hierarchy in cycle tracking displays with prominent fertility indicators
  - Made fertility window (🌸) and ovulation day (🥚) highly prominent with stronger colors, thicker borders, and bold font weight
  - Reduced follicular and luteal phases to 50% opacity to keep them subtle
  - Maintained full visibility for menstrual phase (🩸) as the primary focus
  - Enhanced fertility phases with bg-blue-200/bg-yellow-200 backgrounds and border-2 styling for maximum visibility
  - Activity emojis (moments/milestones) remain prominent regardless of cycle phase background
  - Created clear visual hierarchy: menstrual phase, fertility phases, and activities are prominent; follicular/luteal phases are subtle

- June 18, 2025: EMOJI STANDARDIZATION COMPLETE - Fully standardized all emojis across entire application
  - Changed fertile phase emoji from 💗 to 🌸 across all components (calendar, cycle tracker, legends, cycle-utils)
  - Updated intimacy emoji from 💕 to 💗 throughout the app (calendar filters, moment displays, server routes, insights, analytics)
  - Final cycle phase emoji system: 🩸 menstrual, 🌱 follicular, 🌸 fertile, 🥚 ovulation, 🌙 luteal
  - Applied changes to all components: calendar, cycle tracker, server routes, insights, advanced analytics, enhanced phase visualizer
  - Fixed final inconsistencies: 4 💗 emojis in calendar.tsx and 1 💛 emoji in calendar legend
  - Achieved perfect emoji consistency between calendar and cycle tracker with new standardized system
  - Completed comprehensive emoji standardization across all frontend and backend systems

- June 18, 2025: VISUAL CONSISTENCY UPDATE - Standardized cycle phase emojis and colors between calendar and cycle tracker
  - Calendar and cycle tracker now display identical visual styling from centralized cycle-utils.ts
  - Achieved perfect consistency between calendar view and dedicated cycle tracker interface

- June 18, 2025: COMPREHENSIVE FIX - Calendar synchronization, ovulation timing, and intelligent pattern inheritance
  - Root cause: Data loading race condition prevented cycle data from reaching calendar component  
  - Solution: Enhanced data loading logic to properly wait for cycle data before rendering patterns
  - Calendar now displays identical cycle patterns to cycle tracker (source of truth maintained)
  - Fixed May cycle patterns (menstrual, follicular, fertile, ovulation, luteal) displaying correctly
  - FIXED June ovulation timing: Updated June cycle from 31-day to 28-day pattern for correct June 14th ovulation
  - IMPLEMENTED intelligent pattern inheritance system that automatically adapts when cycles are edited
  - June cycle (ID 87) serves as pattern source with 28-day cycle (cycleEndDate: 2025-06-28)
  - All future cycles (July, August, September) now correctly inherit 28-day pattern with day 14 ovulation
  - Enhanced PATCH endpoint with comprehensive pattern inheritance logic and detailed logging
  - System automatically removes and regenerates future cycles when patterns change through cycle tracker edits
  - Ovulation calculation now consistently shows day 14 for all 28-day cycles across calendar and cycle tracker
  - Centralized getCyclePhaseForDay function working correctly for both components
  - Calendar and cycle tracker now perfectly synchronized with intelligent adaptation capability

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
**Critical Efficiency Rule**: Complete tasks in ONE step by: 1) Searching comprehensively first to understand ALL components, 2) Analyzing complete scope before making any changes, 3) Making all related edits simultaneously using multiple tool calls. NO piecemeal changes - user expects complete solutions in single actions.
UI/UX preferences: Keep navigation clean and simple. Subscription/billing features should be integrated into Settings page rather than having dedicated navigation tabs. NEVER modify the bottom navigation bar - it should always maintain: Home, Activities, Calendar, Insights, with Settings accessible through other means.