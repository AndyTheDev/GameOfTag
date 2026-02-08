import { 
  pgTable, 
  serial, 
  text, 
  integer, 
  timestamp, 
  boolean, 
  uniqueIndex, 
  time, 
  date 
} from 'drizzle-orm/pg-core';

// --- ČÍSELNÍKY ---

export const teams = pgTable('team', {
  idTeam: serial('id_team').primaryKey(),
  name: text('name').notNull(),
});

export const questTypes = pgTable('quest_type', {
  idQuestType: serial('id_quest_type').primaryKey(),
  name: text('name').notNull(),
});

export const privilegeLevels = pgTable('privilege_level', {
  idPrivilegeLevel: serial('id_privilege_level').primaryKey(),
  name: text('name').notNull(),
});

export const logTypes = pgTable('log_type', {
  idLogType: serial('id_log_type').primaryKey(),
  name: text('name').notNull(),
});

export const questStatuses = pgTable('quest_status', {
  idQuestStatus: serial('id_quest_status').primaryKey(),
  name: text('name').notNull(), // Změněno na text pro "Splněno" atd.
});

// --- HLAVNÍ TABULKY ---

export const quests = pgTable('quests', {
  idQuest: serial('id_quest').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  questTypeId: integer('quest_type').notNull().references(() => questTypes.idQuestType),
  timeLimit: integer('time_limit').notNull(), // v sekundách
});

export const players = pgTable('player', {
  idPlayer: serial('id_player').primaryKey(),
  name: text('name').notNull(),
  playName: text('play_name'),
  pass: text('pass').notNull().unique(),
  teamId: integer('team_id').references(() => teams.idTeam),
  privilegeLevel: integer('privilege_level').notNull().references(() => privilegeLevels.idPrivilegeLevel),
  questLock: boolean('quest_lock').notNull().default(false),
  questLockEndtime: timestamp('quest_lock_endtime'),
});

export const locations = pgTable('location', {
  idLocation: serial('id_location').primaryKey(),
  name: text('name').notNull(),
  typeId: integer('type_id').notNull().references(() => questTypes.idQuestType),
  teamId: integer('team_id').references(() => teams.idTeam),
  gps: text('gps').notNull(),
  map: text('map').notNull(),
});

// --- PROGRESS A LOGY ---

export const playerProgress = pgTable('player_progress', {
  idProgress: serial('id_progress').primaryKey(),
  playerId: integer('player_id').references(() => players.idPlayer),
  locationId: integer('location_id').references(() => locations.idLocation),
  completedAt: timestamp('completed_at').defaultNow(),
}, (table) => ({
  // Unikátní index pro zajištění, že hráč splní jednu lokaci jen jednou
  playerLocationUnique: uniqueIndex('player_location_unique').on(table.playerId, table.locationId),
}));

export const gameSessions = pgTable('game_session', {
  idGameSession: serial('id_game_session').primaryKey(),
  date: date('date').notNull(),
  time: time('time').notNull(),
  duration: integer('duration').notNull(), // v sekundách
});

export const logs = pgTable('log', {
  idLog: serial('id_log').primaryKey(),
  gameId: integer('game_id').notNull().references(() => gameSessions.idGameSession),
  logTime: timestamp('log_time').notNull().defaultNow(),
  logTypeId: integer('log_type').notNull().references(() => logTypes.idLogType),
  playerId: integer('player_id').notNull().references(() => players.idPlayer),
  locationId: integer('location_id').notNull().references(() => locations.idLocation),
  questId: integer('quest_id').references(() => quests.idQuest),
  questStatusId: integer('quest_status').references(() => questStatuses.idQuestStatus),
});