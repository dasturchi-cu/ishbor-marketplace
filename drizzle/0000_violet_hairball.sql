CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'banned', 'pending');--> statement-breakpoint
CREATE TYPE "public"."active_role" AS ENUM('client', 'freelancer', 'agency');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('client', 'freelancer');--> statement-breakpoint
CREATE TABLE "active_role_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"active_role" "active_role" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"remember" boolean DEFAULT false NOT NULL,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(200),
	"skills" text[] DEFAULT '{}' NOT NULL,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"availability" jsonb DEFAULT '{}'::jsonb,
	"rate_usd" integer,
	"industry" varchar(100),
	"team_size" varchar(50),
	"hiring_goals" text[] DEFAULT '{}' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password_hash" text,
	"full_name" varchar(120) NOT NULL,
	"user_type" "user_type" NOT NULL,
	"username" varchar(50),
	"company_slug" varchar(80),
	"company" varchar(200),
	"avatar_hue" integer DEFAULT 220 NOT NULL,
	"bio" text,
	"location" varchar(120),
	"is_admin" boolean DEFAULT false NOT NULL,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_company_slug_unique" UNIQUE("company_slug")
);
--> statement-breakpoint
ALTER TABLE "active_role_preferences" ADD CONSTRAINT "active_role_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_status" ON "users" USING btree ("account_status");