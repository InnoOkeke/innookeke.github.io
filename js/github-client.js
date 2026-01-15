// GitHub API Client - Handles communication with GitHub REST API v3
// Fetches repository information for a given username

/**
 * GitHubClient - Fetches and parses repository data from GitHub API
 */
export class GitHubClient {
  /**
   * @param {string} username - GitHub username to fetch repositories for
   */
  constructor(username) {
    this.username = username;
    this.apiBase = 'https://api.github.com';
  }

  /**
   * Fetch all repositories for the user
   * @returns {Promise<Array>} Array of parsed project objects
   */
  async fetchRepositories() {
    try {
      const url = `${this.apiBase}/users/${this.username}/repos?sort=updated&per_page=100&type=owner`;
      
      console.log(`Fetching repositories for ${this.username}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repos = await response.json();
      
      console.log(`Fetched ${repos.length} repositories from GitHub`);
      
      // Parse each repository into our Project format
      const projects = repos.map(repo => this.parseRepository(repo));
      
      // Enhance projects with README descriptions and logos
      const enhancedProjects = await this.enhanceProjects(projects);
      
      return enhancedProjects;
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      throw error;
    }
  }

  /**
   * Enhance projects with README descriptions and logo images
   * @param {Array} projects - Array of project objects
   * @returns {Promise<Array>} Enhanced projects
   */
  async enhanceProjects(projects) {
    // Skip enhancement to reduce API calls and avoid rate limiting
    console.log('Skipping README and logo enhancement to avoid rate limits');
    return projects;
    
    /* Original enhancement code - disabled to reduce API calls
    const enhancedProjects = [];
    
    for (const project of projects) {
      try {
        // Fetch README and logo in parallel
        const [readme, logo] = await Promise.all([
          this.fetchReadmeDescription(project.name),
          this.fetchLogo(project.name)
        ]);
        
        // Update project with enhanced data
        const enhanced = {
          ...project,
          description: readme || project.description,
          thumbnail: logo || project.thumbnail
        };
        
        enhancedProjects.push(enhanced);
      } catch (error) {
        // If enhancement fails, use original project
        console.warn(`Failed to enhance ${project.name}:`, error.message);
        enhancedProjects.push(project);
      }
    }
    
    return enhancedProjects;
    */
  }

  /**
   * Fetch README content and extract description
   * @param {string} repoName - Repository name
   * @returns {Promise<string|null>} Extracted description or null
   */
  async fetchReadmeDescription(repoName) {
    try {
      const url = `${this.apiBase}/repos/${this.username}/${repoName}/readme`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3.raw' }
      });
      
      if (!response.ok) {
        return null;
      }
      
      const readme = await response.text();
      
      // Extract first paragraph or description section
      const description = this.extractDescription(readme);
      
      return description;
    } catch (error) {
      console.warn(`Failed to fetch README for ${repoName}:`, error.message);
      return null;
    }
  }

  /**
   * Extract description from README content
   * @param {string} readme - README content
   * @returns {string|null} Extracted description
   */
  extractDescription(readme) {
    if (!readme) return null;
    
    // Remove title (first line starting with #)
    const lines = readme.split('\n');
    let startIndex = 0;
    
    // Skip title and empty lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#')) {
        startIndex = i;
        break;
      }
    }
    
    // Get first paragraph (until empty line or next heading)
    const paragraphLines = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop at empty line or next heading
      if (!line || line.startsWith('#')) {
        break;
      }
      
      paragraphLines.push(line);
    }
    
    const description = paragraphLines.join(' ').trim();
    
    // Limit length and clean up markdown
    if (description) {
      return this.cleanMarkdown(description).substring(0, 200);
    }
    
    return null;
  }

  /**
   * Clean markdown formatting from text
   * @param {string} text - Text with markdown
   * @returns {string} Cleaned text
   */
  cleanMarkdown(text) {
    return text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/[*_~`]/g, '') // Remove formatting
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Fetch logo/icon from repository
   * @param {string} repoName - Repository name
   * @returns {Promise<string|null>} Logo URL or null
   */
  async fetchLogo(repoName) {
    // Common logo file paths to check
    const logoPaths = [
      'logo.png',
      'logo.svg',
      'icon.png',
      'icon.svg',
      'assets/logo.png',
      'assets/logo.svg',
      'assets/icon.png',
      'assets/icon.svg',
      'public/logo.png',
      'public/logo.svg',
      'public/icon.png',
      'public/icon.svg',
      'images/logo.png',
      'images/logo.svg'
    ];
    
    for (const path of logoPaths) {
      try {
        const url = `${this.apiBase}/repos/${this.username}/${repoName}/contents/${path}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          // Return raw GitHub content URL
          return `https://raw.githubusercontent.com/${this.username}/${repoName}/main/${path}`;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    return null;
  }

  /**
   * Parse a GitHub repository response into a Project object
   * @param {Object} repoData - Raw repository data from GitHub API
   * @returns {Object} Parsed project object
   */
  parseRepository(repoData) {
    // Handle description: null/undefined becomes default, empty string stays empty
    let description = 'No description available';
    if (repoData.description !== null && repoData.description !== undefined) {
      description = repoData.description;
    }

    return {
      id: String(repoData.id),
      name: repoData.name || '',
      description: description,
      repoUrl: repoData.html_url || '',
      liveUrl: repoData.homepage || repoData.html_url || '',
      thumbnail: null, // Will be set later if custom thumbnails are configured
      topics: repoData.topics || [],
      updatedAt: repoData.updated_at || new Date().toISOString(),
      isPriority: false, // Will be set by project processor
      source: 'github',
      fork: repoData.fork || false
    };
  }

  /**
   * Sort repositories by most recently updated
   * @param {Array} repos - Array of repository objects
   * @returns {Array} Sorted array
   */
  sortByUpdated(repos) {
    return [...repos].sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB - dateA; // Most recent first
    });
  }

  /**
   * Filter out forked repositories
   * @param {Array} repos - Array of repository objects
   * @returns {Array} Filtered array without forks
   */
  filterForks(repos) {
    return repos.filter(repo => !repo.fork);
  }
}
