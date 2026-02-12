// import { relations } from 'drizzle-orm';
// import * as schema from './schema';

// // --- RELACE PRO TÝMY ---
// export const teamsRelations = relations(schema.teams, ({ many }) => ({
//   players: many(schema.players),
//   locations: many(schema.locations),
// }));

// // --- RELACE PRO ROLE HRÁČŮ ---
// export const playerRolesRelations = relations(schema.playerRoles, ({ many }) => ({
//   players: many(schema.players),
// }));

// // --- RELACE PRO HRÁČE ---
// export const playersRelations = relations(schema.players, ({ one, many }) => ({
//   team: one(schema.teams, {
//     fields: [schema.players.teamId],
//     references: [schema.teams.idTeam],
//   }),
//   privilege: one(schema.privilegeLevels, {
//     fields: [schema.players.privilegeLevel],
//     references: [schema.privilegeLevels.idPrivilegeLevel],
//   }),
//   role: one(schema.playerRoles, {
//     fields: [schema.players.roleId],
//     references: [schema.playerRoles.idPlayerRole],
//   }),
//   progress: many(schema.playerProgress),
//   logs: many(schema.logs),
// }));

// // --- RELACE PRO LOKACE ---
// export const locationsRelations = relations(schema.locations, ({ one, many }) => ({
//   team: one(schema.teams, {
//     fields: [schema.locations.teamId],
//     references: [schema.teams.idTeam],
//   }),
//   type: one(schema.questTypes, {
//     fields: [schema.locations.typeId],
//     references: [schema.questTypes.idQuestType],
//   }),
//   progress: many(schema.playerProgress),
//   logs: many(schema.logs),
// }));

// // --- RELACE PRO ÚKOLY ---
// export const questsRelations = relations(schema.quests, ({ one, many }) => ({
//   type: one(schema.questTypes, {
//     fields: [schema.quests.questTypeId],
//     references: [schema.questTypes.idQuestType],
//   }),
//   logs: many(schema.logs),
// }));

// // --- RELACE PRO PROGRESS HRÁČE ---
// export const playerProgressRelations = relations(schema.playerProgress, ({ one }) => ({
//   player: one(schema.players, {
//     fields: [schema.playerProgress.playerId],
//     references: [schema.players.idPlayer],
//   }),
//   location: one(schema.locations, {
//     fields: [schema.playerProgress.locationId],
//     references: [schema.locations.idLocation],
//   }),
// }));

// // --- RELACE PRO LOGY ---
// export const logsRelations = relations(schema.logs, ({ one }) => ({
//   session: one(schema.gameSessions, {
//     fields: [schema.logs.gameId],
//     references: [schema.gameSessions.idGameSession],
//   }),
//   type: one(schema.logTypes, {
//     fields: [schema.logs.logTypeId],
//     references: [schema.logTypes.idLogType],
//   }),
//   player: one(schema.players, {
//     fields: [schema.logs.playerId],
//     references: [schema.players.idPlayer],
//   }),
//   location: one(schema.locations, {
//     fields: [schema.logs.locationId],
//     references: [schema.locations.idLocation],
//   }),
//   quest: one(schema.quests, {
//     fields: [schema.logs.questId],
//     references: [schema.quests.idQuest],
//   }),
//   status: one(schema.questStatuses, {
//     fields: [schema.logs.questStatusId],
//     references: [schema.questStatuses.idQuestStatus],
//   }),
// }));

// // --- RELACE PRO TYPY A STATUSY ---
// export const questTypesRelations = relations(schema.questTypes, ({ many }) => ({
//   quests: many(schema.quests),
//   locations: many(schema.locations),
// }));

// export const logTypesRelations = relations(schema.logTypes, ({ many }) => ({
//   logs: many(schema.logs),
// }));

// export const questStatusesRelations = relations(schema.questStatuses, ({ many }) => ({
//   logs: many(schema.logs),
// }));

// export const privilegeLevelsRelations = relations(schema.privilegeLevels, ({ many }) => ({
//   players: many(schema.players),
// }));

// export const gameSessionsRelations = relations(schema.gameSessions, ({ many }) => ({
//   logs: many(schema.logs),
// }));

// --- VERSION 2 - ÚPRAVA NOVÝCH VAZEB ---
import { relations } from 'drizzle-orm';
import * as schema from './schema';

// --- RELACE PRO TÝMY ---
export const teamsRelations = relations(schema.teams, ({ many }) => ({
  players: many(schema.players),
  locations: many(schema.locations),
}));

// --- RELACE PRO ROLE HRÁČŮ ---
export const playerRolesRelations = relations(schema.playerRoles, ({ many }) => ({
  players: many(schema.players),
}));

// --- RELACE PRO HRÁČE ---
export const playersRelations = relations(schema.players, ({ one, many }) => ({
  team: one(schema.teams, {
    fields: [schema.players.teamId],
    references: [schema.teams.idTeam],
  }),
  privilege: one(schema.privilegeLevels, {
    fields: [schema.players.privilegeLevel],
    references: [schema.privilegeLevels.idPrivilegeLevel],
  }),
  role: one(schema.playerRoles, {
    fields: [schema.players.roleId],
    references: [schema.playerRoles.idPlayerRole],
  }),
  progress: many(schema.playerProgress),
  
  // Relace pro logy, které tento hráč vytvořil (např. splnil úkol, chytil někoho)
  logs: many(schema.logs, { relationName: "playerActionLogs" }),
  
  // NOVÉ: Relace pro logy, kde tento hráč figuruje jako "chycený"
  caughtInLogs: many(schema.logs, { relationName: "caughtPlayerLogs" }),
}));

// --- RELACE PRO LOKACE ---
export const locationsRelations = relations(schema.locations, ({ one, many }) => ({
  team: one(schema.teams, {
    fields: [schema.locations.teamId],
    references: [schema.teams.idTeam],
  }),
  type: one(schema.questTypes, {
    fields: [schema.locations.typeId],
    references: [schema.questTypes.idQuestType],
  }),
  progress: many(schema.playerProgress),
  logs: many(schema.logs),
}));

// --- RELACE PRO ÚKOLY (QUESTS) ---
export const questsRelations = relations(schema.quests, ({ one, many }) => ({
  type: one(schema.questTypes, {
    fields: [schema.quests.questTypeId],
    references: [schema.questTypes.idQuestType],
  }),
  logs: many(schema.logs),
}));

// --- RELACE PRO PROGRESS HRÁČE ---
export const playerProgressRelations = relations(schema.playerProgress, ({ one }) => ({
  player: one(schema.players, {
    fields: [schema.playerProgress.playerId],
    references: [schema.players.idPlayer],
  }),
  location: one(schema.locations, {
    fields: [schema.playerProgress.locationId],
    references: [schema.locations.idLocation],
  }),
}));

// --- RELACE PRO LOGY ---
export const logsRelations = relations(schema.logs, ({ one }) => ({
  session: one(schema.gameSessions, {
    fields: [schema.logs.gameId],
    references: [schema.gameSessions.idGameSession],
  }),
  type: one(schema.logTypes, {
    fields: [schema.logs.logTypeId],
    references: [schema.logTypes.idLogType],
  }),
  
  // Hráč, který log vytvořil (Lovec, který chytil / Běžec, který doběhl)
  player: one(schema.players, {
    fields: [schema.logs.playerId],
    references: [schema.players.idPlayer],
    relationName: "playerActionLogs", // Musí odpovídat názvu v playersRelations
  }),

  // NOVÉ: Hráč, který byl chycen (pokud existuje)
  caughtPlayer: one(schema.players, {
    fields: [schema.logs.caughtPlayerId],
    references: [schema.players.idPlayer],
    relationName: "caughtPlayerLogs", // Musí odpovídat názvu v playersRelations
  }),

  location: one(schema.locations, {
    fields: [schema.logs.locationId],
    references: [schema.locations.idLocation],
  }),
  quest: one(schema.quests, {
    fields: [schema.logs.questId],
    references: [schema.quests.idQuest],
  }),
  status: one(schema.questStatuses, {
    fields: [schema.logs.questStatusId],
    references: [schema.questStatuses.idQuestStatus],
  }),
}));

// --- RELACE PRO TYPY A STATUSY (ČÍSELNÍKY) ---
export const questTypesRelations = relations(schema.questTypes, ({ many }) => ({
  quests: many(schema.quests),
  locations: many(schema.locations),
}));

export const logTypesRelations = relations(schema.logTypes, ({ many }) => ({
  logs: many(schema.logs),
}));

export const questStatusesRelations = relations(schema.questStatuses, ({ many }) => ({
  logs: many(schema.logs),
}));

export const privilegeLevelsRelations = relations(schema.privilegeLevels, ({ many }) => ({
  players: many(schema.players),
}));

export const gameSessionsRelations = relations(schema.gameSessions, ({ many }) => ({
  logs: many(schema.logs),
}));