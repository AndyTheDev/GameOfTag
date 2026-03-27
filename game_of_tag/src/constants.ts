// ID Rolí (musí odpovídat ID v tabulce player_role)
export const ROLE_RUNNER_ID = 1;
export const ROLE_HUNTER_ID = 2;

// Typy logů
export const LOG_TYPE_START = 1; // Spuštění úkolu
export const LOG_TYPE_TIMEOUT = 2; // Neúspěšný úkol, čas vypršel
export const LOG_TYPE_SUCCESS = 3; // Úspěšný úkol
export const LOG_TYPE_TIMEOUT_RESET = 4; // Hráč může znova plnit úkoly / lovit
export const LOG_TYPE_GPS_NOT_ACCURATE = 5; // Hráč se pokusil zjistit GPS, ale nedosáhl požadované přsnosti
export const LOG_TYPE_CATCH = 6; //Došlo k chycení hráče
export const LOG_TYPE_BUBBLE = 7; // Běžec si aktivoval bublinu
export const LOG_TYPE_BUBBLE_BURST = 8; // Běžci vypršela bublina
export const LOG_TYPE_HUNTER_TIMEOUT = 9; //Lovec nesmí lovit ani se hýbat
export const LOG_TYPE_HUNTER_TIMEOUT_RESET = 10; // Lovec je uvolněn z timeoutu
export const LOG_TYPE_QUEST_CANCELLED = 11; // Úkol byl zrušen (někdo ze skupiny byl chycen)

// Jiné
export const REDIRECT_DELAY_MS = 2000;