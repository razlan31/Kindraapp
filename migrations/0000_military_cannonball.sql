CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"unlock_criteria" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"profile_image" text,
	"relationship_stage" text NOT NULL,
	"start_date" timestamp,
	"birthday" timestamp,
	"zodiac_sign" text,
	"love_language" text,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menstrual_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"notes" text,
	"mood" text,
	"symptoms" json,
	"flow_intensity" text
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"connection_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"is_anniversary" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"color" text DEFAULT '#C084FC',
	"icon" text DEFAULT 'cake'
);
--> statement-breakpoint
CREATE TABLE "moments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"connection_id" integer NOT NULL,
	"emoji" text NOT NULL,
	"content" text NOT NULL,
	"tags" json,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"is_intimate" boolean DEFAULT false,
	"intimacy_rating" text,
	"related_to_menstrual_cycle" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"reflection" text
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"profile_image" text,
	"zodiac_sign" text,
	"love_language" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
