/**
 * Route configuration for the (apply) group
 * 
 * This file helps organize the application-related routes
 * and can be used to define any route group specific settings.
 */
export const dynamic = 'force-static'; // Use static generation for improved performance
export const revalidate = 3600; // Revalidate cached content every hour

// Additional route group configuration can be added here