// URL Resolver - Handles URL fallback logic for projects
// Determines the best live URL for a project based on available sources

/**
 * Resolve the live URL for a project using fallback chain
 * Priority: Vercel production URL > GitHub homepage > GitHub repo URL
 * 
 * @param {Object} project - Project object with URLs
 * @param {string|null} vercelUrl - Vercel production URL (optional)
 * @returns {string} Resolved live URL
 */
export function resolveLiveUrl(project, vercelUrl = null) {
  // Priority 1: Vercel production URL
  if (vercelUrl && vercelUrl.trim() !== '') {
    return vercelUrl;
  }

  // Priority 2: GitHub homepage URL (if not empty and not same as repo URL)
  if (project.homepage && 
      project.homepage.trim() !== '' && 
      project.homepage !== project.repoUrl) {
    return project.homepage;
  }

  // Priority 3: GitHub repository URL (always available)
  return project.repoUrl;
}

/**
 * Update project with Vercel deployment URL if available
 * 
 * @param {Object} project - Project object
 * @param {string|null} vercelUrl - Vercel production URL (optional)
 * @returns {Object} Updated project object
 */
export function updateProjectWithVercelUrl(project, vercelUrl) {
  return {
    ...project,
    liveUrl: resolveLiveUrl(project, vercelUrl),
    source: vercelUrl ? 'both' : project.source
  };
}
