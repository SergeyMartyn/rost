export type Purpose = 'analytics' | 'media';
export interface OptionalService {
  id: string;
  purpose: Purpose;
  start: () => void | (() => void);
}
// Add integrations here. All network calls/imports must happen inside start().
// Return a cleanup function; revocation also reloads the page to stop running code.
export const services: OptionalService[] = [];
