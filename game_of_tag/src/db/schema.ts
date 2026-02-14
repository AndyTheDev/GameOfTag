import { 
  pgTable, 
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
  idTeam: integer('id_team').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  points: integer('points').notNull().default(0),
});

export const playerRoles = pgTable('player_role', {
  idPlayerRole: integer('id_player_role').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
});

export const questTypes = pgTable('quest_type', {
  idQuestType: integer('id_quest_type').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
});

export const privilegeLevels = pgTable('privilege_level', {
  idPrivilegeLevel: integer('id_privilege_level').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
});

export const logTypes = pgTable('log_type', {
  idLogType: integer('id_log_type').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
});

export const questStatuses = pgTable('quest_status', {
  idQuestStatus: integer('id_quest_status').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(), 
});

// --- HLAVNÍ TABULKY ---

export const quests = pgTable('quests', {
  idQuest: integer('id_quest').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  questTypeId: integer('quest_type').notNull().references(() => questTypes.idQuestType),
  timeLimit: integer('time_limit').notNull(),
});

export const players = pgTable('player', {
  idPlayer: integer('id_player').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  playName: text('play_name'),
  pass: text('pass').notNull().unique(),
  teamId: integer('team_id').references(() => teams.idTeam),
  privilegeLevel: integer('privilege_level').notNull().references(() => privilegeLevels.idPrivilegeLevel),
  questLock: boolean('quest_lock').notNull().default(false),
  questLockEndtime: timestamp('quest_lock_endtime'),
  roleId: integer('role_id').references(() => playerRoles.idPlayerRole),
  points: integer('points').notNull().default(0),
  bubbleBurstTime: timestamp('bubble_burst_time'),
  runnerShieldTime: timestamp('runner_shield_time'),
  questEndTime: timestamp('quest_end_time'),
});

export const locations = pgTable('location', {
  idLocation: integer('id_location').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  typeId: integer('type_id').notNull().references(() => questTypes.idQuestType),
  teamId: integer('team_id').references(() => teams.idTeam),
  gps: text('gps').notNull(),
  completed: boolean('completed').default(false)
});

// --- PROGRESS A LOGY ---

export const playerProgress = pgTable('player_progress', {
  idProgress: integer('id_progress').primaryKey().generatedByDefaultAsIdentity(),
  playerId: integer('player_id').references(() => players.idPlayer),
  locationId: integer('location_id').references(() => locations.idLocation),
  completedAt: timestamp('completed_at').defaultNow(),
}, (table) => ({
  // Unikátní index pro zajištění, že hráč splní jednu lokaci jen jednou
  playerLocationUnique: uniqueIndex('player_location_unique').on(table.playerId, table.locationId),
}));

export const gameSessions = pgTable('game_session', {
  idGameSession: integer('id_game_session').primaryKey().generatedByDefaultAsIdentity(),
  date: date('date').notNull(),
  time: time('time').notNull(),
  duration: integer('duration').notNull(), // v sekundách
});

export const logs = pgTable('log', {
  idLog: integer('id_log').primaryKey().generatedByDefaultAsIdentity(),
  gameId: integer('game_id').notNull().references(() => gameSessions.idGameSession),
  logTime: timestamp('log_time').notNull().defaultNow(),
  logTypeId: integer('log_type').notNull().references(() => logTypes.idLogType),
  playerId: integer('player_id').notNull().references(() => players.idPlayer),
  locationId: integer('location_id').references(() => locations.idLocation),
  questId: integer('quest_id').references(() => quests.idQuest),
  questStatusId: integer('quest_status').references(() => questStatuses.idQuestStatus),
  caughtPlayerId: integer('caught_player_id').references(() => players.idPlayer),
});