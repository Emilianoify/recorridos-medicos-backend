export const CONFIG = {
  // Audit Report Configuration
  AUDIT: {
    DEFAULT_DAYS_RANGE: 30,
    HIGH_RISK_THRESHOLD: 0.1, // 10% flagged changes
    MEDIUM_RISK_THRESHOLD: 0.05, // 5% flagged changes
    CRITICAL_CHANGES_THRESHOLD: 0.05, // 5% critical changes
    MAX_TOP_CHANGERS: 10,
    MAX_FLAGGED_ACTIVITIES: 50,
  },
  
  // Authentication Configuration
  AUTH: {
    MAX_LOGIN_ATTEMPTS: 5,
    TOKEN_EXPIRY_HOURS: 1,
    REFRESH_TOKEN_EXPIRY_DAYS: 7,
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 24,
  },
  
  // Pagination Configuration
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  
  // Visit Configuration
  VISITS: {
    MAX_VISITS_PER_DAY: 24,
    MIN_VISIT_DURATION_MINUTES: 1,
    MAX_VISIT_DURATION_MINUTES: 480,
  },
  
  // Journey Configuration
  JOURNEYS: {
    MAX_VISITS_PER_JOURNEY: 50,
    MAX_ESTIMATED_VISITS: 50,
  },
  
  // Holiday Configuration
  HOLIDAYS: {
    MIN_SYNC_YEAR: 2020,
    MAX_SYNC_YEAR: 2030,
    DEFAULT_COUNTRY: 'AR',
    DEFAULT_LOCALE: 'es-AR',
  },
};