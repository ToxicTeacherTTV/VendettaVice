// Game-wide constants for Vendetta Vice

export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  BACKGROUND_COLOR: 0x0a0005,
};

// Tony "The Fork" Bellucci stats
export const PLAYER = {
  SPEED: 200,
  HEALTH: 100,
  PUNCH_DAMAGE: 12,
  KICK_DAMAGE: 18,
  ENVIRONMENTAL_KILL_DAMAGE: 999,
  PARRY_WINDOW_MS: 110,    // tight but fair — tap C before impact
  PARRY_COOLDOWN_MS: 350,  // low cooldown keeps it available; the window does the gating
};

// Respect meter — honor system
// Falls when you fight dirty; rises when you fight with style
export const RESPECT = {
  MAX: 100,
  START: 50,                // less buffer means honor tension starts immediately
  PENALTY_CHEAP_SHOT: 10,   // hitting downed enemies
  PENALTY_ENVIRON_KILL: 15, // most powerful skip option deserves the biggest cost
  GAIN_PARRY: 6,            // capped per-enemy in game logic to prevent farming
  GAIN_CLEAN_KO: 4,
  GAIN_FAIR_FIGHT: 3,       // winning an even 1v1
  THRESHOLD_MOBSTER_HELP: 45, // tighter ceiling forces real choices early
};

// Enemy HP — tuned so combos and parries are felt before the KO
export const ENEMY_HP = {
  TRACKSUIT_GOON: 60,
  PASTA_DEALER: 78,
  ENFORCER: 125,
  EARL_GREY_AGENT: 92,
};

// Enemy types
export const ENEMY_TYPE = {
  TRACKSUIT_GOON: 'tracksuit_goon',
  PASTA_DEALER: 'pasta_dealer',
  ENFORCER: 'enforcer',
  EARL_GREY_AGENT: 'earl_grey_agent', // British arch-nemesis faction
};

// The omertà code — sequence of inputs for the secret ending
// (Arrow keys + action buttons — classic arcade code style)
export const OMERTA_CODE = ['UP', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'PUNCH', 'KICK'];

// Scene keys
export const SCENE = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  GAME: 'GameScene',
  UI: 'UIScene',
  SECRET_ENDING: 'SecretEndingScene',
};
