/**
 * Dev-only live tuning.
 *
 * Merges public/tuning.json into the live constants objects so a plain
 * browser refresh picks up any edits — no rebuild or redeploy needed.
 *
 * Called once from BootScene after Phaser's asset loader finishes.
 * In production builds Vite dead-code-eliminates everything inside the
 * `import.meta.env.DEV` guard, so none of this ships to players.
 */

import * as C from './constants.js';

/**
 * Apply a pre-fetched tuning object to the live constants.
 * Unknown namespaces and unknown keys are silently ignored.
 * @param {Record<string, Record<string, number>>} overrides
 */
export function applyOverrides(overrides) {
  if (!import.meta.env.DEV) return;
  for (const [ns, vals] of Object.entries(overrides)) {
    if (ns.startsWith('_')) continue;          // skip comment/meta keys
    if (!C[ns] || typeof vals !== 'object') continue;
    Object.assign(C[ns], vals);
  }
}
