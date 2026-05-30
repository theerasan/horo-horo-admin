// Environment-based API URL
// Set VITE_API_URL in your .env file for each environment.
// Defaults to localhost:8080 for development.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
