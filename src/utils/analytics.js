export const ANALYTICS_MESSAGE = '[Analytics] User interacted with Performance Optimization'

/**
 * Simulated analytics ping, called when a primary action COMPLETES
 * (search applied, category/sort changed, bookmark toggled, story submitted).
 *
 * It deliberately carries no payload: no search text, titles, emails or ids are
 * ever logged, so telemetry cannot leak personal data.
 */
export function trackInteraction() {
  console.log(ANALYTICS_MESSAGE)
}
