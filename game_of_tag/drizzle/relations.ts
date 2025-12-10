import { relations } from "drizzle-orm/relations";
import { gameSession, log, logType, player, gameset, locations, quests, questStatus, locationStatus, gamesetLocations } from "./schema";

export const logRelations = relations(log, ({one}) => ({
	gameSession: one(gameSession, {
		fields: [log.gameId],
		references: [gameSession.idGameSession]
	}),
	logType: one(logType, {
		fields: [log.logTypeId],
		references: [logType.idLogType]
	}),
	player: one(player, {
		fields: [log.playerId],
		references: [player.idPlayer]
	}),
	gameset: one(gameset, {
		fields: [log.gamesetId],
		references: [gameset.idGameset]
	}),
	location: one(locations, {
		fields: [log.locationId],
		references: [locations.idLocation]
	}),
	quest: one(quests, {
		fields: [log.questId],
		references: [quests.idQuest]
	}),
	questStatus: one(questStatus, {
		fields: [log.questStatusId],
		references: [questStatus.idQuestStatus]
	}),
	locationStatus: one(locationStatus, {
		fields: [log.locationStatusId],
		references: [locationStatus.idLocationStatus]
	}),
}));

export const gameSessionRelations = relations(gameSession, ({many}) => ({
	logs: many(log),
}));

export const logTypeRelations = relations(logType, ({many}) => ({
	logs: many(log),
}));

export const playerRelations = relations(player, ({many}) => ({
	logs: many(log),
}));

export const gamesetRelations = relations(gameset, ({many}) => ({
	logs: many(log),
	gamesetLocations: many(gamesetLocations),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	logs: many(log),
	gamesetLocations: many(gamesetLocations),
}));

export const questsRelations = relations(quests, ({many}) => ({
	logs: many(log),
}));

export const questStatusRelations = relations(questStatus, ({many}) => ({
	logs: many(log),
}));

export const locationStatusRelations = relations(locationStatus, ({many}) => ({
	logs: many(log),
}));

export const gamesetLocationsRelations = relations(gamesetLocations, ({one}) => ({
	gameset: one(gameset, {
		fields: [gamesetLocations.gamesetId],
		references: [gameset.idGameset]
	}),
	location: one(locations, {
		fields: [gamesetLocations.locationId],
		references: [locations.idLocation]
	}),
}));