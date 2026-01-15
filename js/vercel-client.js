// Vercel API Client - Handles communication with Vercel REST API
// Fetches deployment information for projects

/**
 * VercelClient - Fetches deployment data from Vercel API
 */
export class VercelClient {
  /**
   * @param {string|null} token - Vercel API token (optional)
   * @param {string|null} teamId - Vercel team ID (optional)
   */
  constructor(token, teamId = null) {
    this.token = token;
    this.teamId = teamId;
    this.apiBase = 'https://api.vercel.com';
  }

  /**
   * Check if Vercel client is configured (has token)
   * @returns {boolean}
   */
  isConfigured() {
    return this.token !== null && this.token !== undefined && this.token !== '';
  }

  /**
   * Fetch deployments for a specific project
   * @param {string} projectName - Name of the project
   * @returns {Promise<Array>} Array of deployment objects
   */
  async fetchDeployments(projectName) {
    if (!this.isConfigured()) {
      console.warn('Vercel API token not configured, skipping Vercel deployments');
      return [];
    }

    try {
      // Build URL with query parameters
      let url = `${this.apiBase}/v6/deployments?projectId=${encodeURIComponent(projectName)}&limit=20`;
      
      if (this.teamId) {
        url += `&teamId=${encodeURIComponent(this.teamId)}`;
      }

      console.log(`Fetching Vercel deployments for project: ${projectName}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        // Don't throw on 404 or auth errors, just log and return empty
        if (response.status === 404) {
          console.log(`No Vercel deployments found for ${projectName}`);
          return [];
        }
        if (response.status === 401 || response.status === 403) {
          console.warn(`Vercel authentication failed for ${projectName}`);
          return [];
        }
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const deployments = data.deployments || [];
      
      console.log(`Found ${deployments.length} deployments for ${projectName}`);
      
      return deployments;
    } catch (error) {
      console.error(`Error fetching Vercel deployments for ${projectName}:`, error);
      return [];
    }
  }

  /**
   * Get the production deployment URL from a list of deployments
   * @param {Array} deployments - Array of deployment objects
   * @returns {string|null} Production URL or null if not found
   */
  getProductionUrl(deployments) {
    if (!Array.isArray(deployments) || deployments.length === 0) {
      return null;
    }

    // Find the first deployment that is:
    // 1. Target is "production"
    // 2. State is "READY"
    const productionDeployment = deployments.find(
      deployment => 
        deployment.target === 'production' && 
        deployment.state === 'READY'
    );

    if (productionDeployment && productionDeployment.url) {
      // Return full HTTPS URL
      return `https://${productionDeployment.url}`;
    }

    return null;
  }

  /**
   * Fetch production URL for a project
   * @param {string} projectName - Name of the project
   * @returns {Promise<string|null>} Production URL or null
   */
  async fetchProductionUrl(projectName) {
    const deployments = await this.fetchDeployments(projectName);
    return this.getProductionUrl(deployments);
  }
}
