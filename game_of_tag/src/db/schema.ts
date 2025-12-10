import { pgTable, integer, text, unique, boolean, timestamp, foreignKey, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const locations = pgTable("locations", {
	idLocation: integer("id_location").primaryKey().generatedByDefaultAsIdentity({ name: "locations_id_location_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	gamesetId: integer("gameset_id"),
	name: text().notNull(),
	type: text().notNull(),
	gps: text().notNull(),
	map: text().notNull(),
});

export const player = pgTable("player", {
	idPlayer: integer("id_player").primaryKey().generatedByDefaultAsIdentity({ name: "player_id_player_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	playName: text("play_name"),
	pass: text().notNull(),
	questLock: boolean("quest_lock").default(false).notNull(),
	questLockEndtime: timestamp("quest_lock_endtime", { mode: 'string' }),
}, (table) => [
	unique("player_pass_key").on(table.pass),
]);

export const logType = pgTable("log_type", {
	idLogType: integer("id_log_type").primaryKey().generatedByDefaultAsIdentity({ name: "log_type_id_log_type_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text(),
});

export const gameset = pgTable("gameset", {
	idGameset: integer("id_gameset").primaryKey().generatedByDefaultAsIdentity({ name: "gameset_id_gameset_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
});

export const gameSession = pgTable("game_session", {
	idGameSession: integer("id_game_session").primaryKey().generatedByDefaultAsIdentity({ name: "game_session_id_game_session_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	duration: integer().notNull(),
});

export const log = pgTable("log", {
	idLog: integer("id_log").primaryKey().generatedByDefaultAsIdentity({ name: "log_id_log_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	gameId: integer("game_id").notNull(),
	logTime: timestamp("log_time", { mode: 'string' }).defaultNow().notNull(),
	logTypeId: integer("log_type_id").notNull(),
	playerId: integer("player_id").notNull(),
	gamesetId: integer("gameset_id").notNull(),
	locationId: integer("location_id").notNull(),
	questId: integer("quest_id"),
	questStatusId: integer("quest_status_id"),
	locationStatusId: integer("location_status_id"),
}, (table) => [
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [gameSession.idGameSession],
			name: "log_game_id_fkey"
		}),
	foreignKey({
			columns: [table.logTypeId],
			foreignColumns: [logType.idLogType],
			name: "log_log_type_id_fkey"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [player.idPlayer],
			name: "log_player_id_fkey"
		}),
	foreignKey({
			columns: [table.gamesetId],
			foreignColumns: [gameset.idGameset],
			name: "log_gameset_id_fkey"
		}),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.idLocation],
			name: "log_location_id_fkey"
		}),
	foreignKey({
			columns: [table.questId],
			foreignColumns: [quests.idQuest],
			name: "log_quest_id_fkey"
		}),
	foreignKey({
			columns: [table.questStatusId],
			foreignColumns: [questStatus.idQuestStatus],
			name: "log_quest_status_id_fkey"
		}),
	foreignKey({
			columns: [table.locationStatusId],
			foreignColumns: [locationStatus.idLocationStatus],
			name: "log_location_status_id_fkey"
		}),
]);

export const quests = pgTable("quests", {
	idQuest: integer("id_quest").primaryKey().generatedByDefaultAsIdentity({ name: "quests_id_quest_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
	description: text().notNull(),
	timeLimit: integer("time_limit").notNull(),
});

export const questStatus = pgTable("quest_status", {
	idQuestStatus: integer("id_quest_status").primaryKey().generatedByDefaultAsIdentity({ name: "quest_status_id_quest_status_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
});

export const locationStatus = pgTable("location_status", {
	idLocationStatus: integer("id_location_status").primaryKey().generatedByDefaultAsIdentity({ name: "location_status_id_location_status_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: text().notNull(),
});

export const gamesetLocations = pgTable("gameset_locations", {
	gamesetId: integer("gameset_id").notNull(),
	locationId: integer("location_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.gamesetId],
			foreignColumns: [gameset.idGameset],
			name: "gameset_locations_gameset_id_fkey"
		}),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.idLocation],
			name: "gameset_locations_location_id_fkey"
		}),
	primaryKey({ columns: [table.gamesetId, table.locationId], name: "gameset_locations_pkey"}),
]);
