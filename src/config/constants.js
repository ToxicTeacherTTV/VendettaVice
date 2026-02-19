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
  PARRY_WINDOW_MS: 200,    // window to trigger a parry after blocking
  PARRY_COOLDOWN_MS: 1500,
};

// Respect meter — honor system
// Falls when you fight dirty; rises when you fight with style
export const RESPECT = {
  MAX: 100,
  START: 60,
  PENALTY_CHEAP_SHOT: 10,   // hitting downed enemies, etc.
  PENALTY_ENVIRON_KILL: 5,  // slightly dirty but effective
  GAIN_PARRY: 8,
  GAIN_CLEAN_KO: 5,
  GAIN_FAIR_FIGHT: 3,       // winning an even 1v1
  THRESHOLD_MOBSTER_HELP: 30, // below this, old-school guys walk away
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
