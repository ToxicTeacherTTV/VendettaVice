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

// Combat resolution timings — single source of truth for all hit/hurt logic.
// Change any value here and the full system adjusts; nothing is hardcoded elsewhere.
export const COMBAT = {
  // Player invulnerability after taking a hit (prevents combo shredding)
  IFRAME_DURATION_MS: 600,
  // How long the knockback velocity impulse overrides player input
  KNOCKBACK_DURATION_MS: 200,
  // Horizontal impulse magnitudes
  PLAYER_KNOCKBACK: 300,
  ENEMY_KNOCKBACK: 260,
  // Shared vertical component of every knockback impulse
  KNOCKBACK_VY: -60,
  // How long an enemy is stunned after being hit by the player
  HITSTUN_MS: 300,
  // How long an attacker is stunned after the player successfully parries
  PARRY_STUN_MS: 800,
  // Enemy attack phases (telegraph → hit frame → recovery)
  TELEGRAPH_MS: 500,   // wind-up: player has this window to parry
  RECOVERY_MS: 300,    // post-attack pause before enemy can act again
  ATTACK_COOLDOWN_MS: 1400, // min gap from one attack start to the next
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
  MINI_BOSS: 200, // same class, more HP + faster attacks to pressure-test parry
};

// Enemy types
export const ENEMY_TYPE = {
  TRACKSUIT_GOON: 'tracksuit_goon',
  PASTA_DEALER: 'pasta_dealer',
  ENFORCER: 'enforcer',
  EARL_GREY_AGENT: 'earl_grey_agent', // British arch-nemesis faction
  MINI_BOSS: 'mini_boss',
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
  DEBUG: 'DebugScene',
};
