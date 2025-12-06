import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

// 
export const Locations = pgTable("Locations", {
  id: serial("id").primaryKey(), 
  description: text("description").notNull(), // Zadání úkolu
  time: integer("time").notNull(), // Splněno?
});