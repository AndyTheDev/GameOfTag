CREATE TABLE "game_session" (
	"id_game_session" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"duration" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id_location" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" integer NOT NULL,
	"team_id" integer,
	"latitude" text NOT NULL,
	"map" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_type" (
	"id_log_type" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log" (
	"id_log" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"log_time" timestamp DEFAULT now() NOT NULL,
	"log_type" integer NOT NULL,
	"player_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"quest_id" integer,
	"quest_status" integer
);
--> statement-breakpoint
CREATE TABLE "player_progress" (
	"id_progress" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"location_id" integer,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id_player" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"play_name" text,
	"pass" text NOT NULL,
	"team_id" integer,
	"privilege_level" integer NOT NULL,
	"quest_lock" boolean DEFAULT false NOT NULL,
	"quest_lock_endtime" timestamp,
	CONSTRAINT "player_pass_unique" UNIQUE("pass")
);
--> statement-breakpoint
CREATE TABLE "privilege_level" (
	"id_privilege_level" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_status" (
	"id_quest_status" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_type" (
	"id_quest_type" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id_quest" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"quest_type" integer NOT NULL,
	"time_limit" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id_team" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_type_quest_type_id_quest_type_fk" FOREIGN KEY ("type") REFERENCES "public"."quest_type"("id_quest_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_team_id_team_id_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id_team") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_game_id_game_session_id_game_session_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game_session"("id_game_session") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_log_type_log_type_id_log_type_fk" FOREIGN KEY ("log_type") REFERENCES "public"."log_type"("id_log_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_player_id_player_id_player_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id_player") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_location_id_location_id_location_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id_location") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_quest_id_quests_id_quest_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id_quest") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_quest_status_quest_status_id_quest_status_fk" FOREIGN KEY ("quest_status") REFERENCES "public"."quest_status"("id_quest_status") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_progress" ADD CONSTRAINT "player_progress_player_id_player_id_player_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id_player") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_progress" ADD CONSTRAINT "player_progress_location_id_location_id_location_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id_location") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_team_id_team_id_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id_team") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_privilege_level_privilege_level_id_privilege_level_fk" FOREIGN KEY ("privilege_level") REFERENCES "public"."privilege_level"("id_privilege_level") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_quest_type_quest_type_id_quest_type_fk" FOREIGN KEY ("quest_type") REFERENCES "public"."quest_type"("id_quest_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_location_unique" ON "player_progress" USING btree ("player_id","location_id");