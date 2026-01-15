// Main module for fetching and managing project data
// This orchestrates all other modules to fetch, process, and display projects

import { config } from './config.js';
import { CacheManager } from './cache-manager.js';
import { GitHubClient } from './github-client.js';
import { VercelClient } from './vercel-client.js';
import { ProjectRenderer } from './project-renderer.js';
import { processProjects } from './project-processor.js';
import { updateProjectWithVercelUrl } from './url-resolver.js';
import { retryWithBackoff, handleApiError } from './error-handler.js';

/**
 * ProjectFetcher - Main class that coordinates fetching, caching, and rendering projects
 */
export class ProjectFetcher {
  /**
   * @param {Object} userConfig - Configuration object (merged with defaults)
   */
  constructor(userConfig = {}) {
    // Merge user config with defaults
    this.config = { ...config, ...userConfig };
    
    // Initialize module instances
    this.cacheManager = new CacheManager(`github-projects-v${this.config.cacheVersion || 1}`, this.config.cacheExpiry);
    this.githubClient = new GitHubClient(this.config.githubUsername);
    this.vercelClient = new VercelClient(this.config.vercelToken, this.config.vercelTeamId);
    this.renderer = new ProjectRenderer(this.config.containerSelector);
  }

  /**
   * Initialize the fetcher - sets up cache, checks for cached data, and starts fetch
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('ProjectFetcher initializing...');

    // Initialize renderer
    if (!this.renderer.initialize()) {
      console.error('Failed to initialize renderer - container not found');
      return;
    }

    // Show loading state
    this.renderer.showLoading();

    try {
      // Check for cached data
      const cachedData = this.cacheManager.get();
      
      if (cachedData && !this.cacheManager.isExpired()) {
        console.log('Using cached project data');
        this.renderer.render(cachedData);
        
        // Fetch fresh data in background
        this.fetchAndUpdateProjects(true);
      } else {
        console.log('No valid cache, fetching fresh data');
        await this.fetchAndUpdateProjects(false);
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      
      // Try to use cached data as fallback
      const cachedData = this.cacheManager.get();
      if (cachedData) {
        console.log('Using cached data as fallback');
        this.renderer.render(cachedData);
      } else {
        this.renderer.showError('Unable to load projects. Please try again later.');
      }
    }
  }

  /**
   * Fetch and update projects (with optional background mode)
   * @param {boolean} isBackground - Whether this is a background update
   * @returns {Promise<void>}
   */
  async fetchAndUpdateProjects(isBackground = false) {
    try {
      const projects = await this.fetchProjects();
      
      // Update cache
      this.cacheManager.set(projects);
      
      // Render projects
      this.renderer.render(projects);
      
      if (isBackground) {
        console.log('Background update complete');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      if (!isBackground) {
        // Only show error if not in background mode
        const cachedData = this.cacheManager.get();
        if (cachedData) {
          this.renderer.render(cachedData);
        } else {
          this.renderer.showError('Unable to load projects. Please try again later.');
        }
      }
    }
  }

  /**
   * Fetch projects from GitHub and Vercel APIs
   * @returns {Promise<Array>} Array of project objects
   */
  async fetchProjects() {
    console.log('Fetching projects from GitHub...');

    let githubRepos = [];
    
    try {
      // Fetch GitHub repositories with retry
      githubRepos = await retryWithBackoff(
        () => this.githubClient.fetchRepositories(),
        3,
        1000
      );

      console.log(`Fetched ${githubRepos.length} repositories from GitHub`);
    } catch (error) {
      console.warn('Failed to fetch from GitHub API (rate limit or network error), using manual projects only');
      // Continue with empty array - manual projects will still be shown
    }

    // Fetch Vercel deployments if configured
    let projectsWithUrls = githubRepos;
    
    if (this.vercelClient.isConfigured() && githubRepos.length > 0) {
      console.log('Fetching Vercel deployment URLs...');
      projectsWithUrls = await this.fetchVercelUrls(githubRepos);
    } else {
      console.log('Vercel not configured or no GitHub repos, skipping deployment URL fetch');
    }

    // Merge with manual projects
    const allProjects = this.mergeManualProjects(projectsWithUrls);

    // Process projects (filter, sort, limit)
    const processedProjects = processProjects(allProjects, this.config);

    console.log(`Processed ${processedProjects.length} projects`);

    return processedProjects;
  }

  /**
   * Merge manual projects with auto-fetched projects
   * @param {Array} autoProjects - Auto-fetched projects
   * @returns {Array} Merged projects
   */
  mergeManualProjects(autoProjects) {
    const manualProjects = this.config.manualProjects || [];
    
    if (manualProjects.length === 0) {
      return autoProjects;
    }
    
    console.log(`Merging ${manualProjects.length} manual projects`);
    
    // Combine arrays
    return [...autoProjects, ...manualProjects];
  }

  /**
   * Fetch Vercel URLs for projects
   * @param {Array} projects - Array of project objects
   * @returns {Promise<Array>} Projects with Vercel URLs added
   */
  async fetchVercelUrls(projects) {
    const projectsWithUrls = [];

    for (const project of projects) {
      try {
        // Fetch production URL for this project with retry
        const productionUrl = await retryWithBackoff(
          () => this.vercelClient.fetchProductionUrl(project.name),
          2, // Fewer retries for Vercel (to avoid rate limits)
          500
        );

        // Update project with Vercel URL
        const updatedProject = updateProjectWithVercelUrl(project, productionUrl);
        projectsWithUrls.push(updatedProject);
      } catch (error) {
        // If Vercel fetch fails, just use the project without Vercel URL
        console.warn(`Failed to fetch Vercel URL for ${project.name}:`, error.message);
        projectsWithUrls.push(project);
      }
    }

    return projectsWithUrls;
  }

  /**
   * Render projects to the DOM
   * @param {Array} projects - Array of project objects to render
   */
  renderProjects(projects) {
    this.renderer.render(projects);
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.cacheManager.clear();
    console.log('Cache cleared');
  }

  /**
   * Refresh projects (clear cache and fetch fresh data)
   * @returns {Promise<void>}
   */
  async refresh() {
    console.log('Refreshing projects...');
    this.clearCache();
    this.renderer.showLoading();
    await this.fetchAndUpdateProjects(false);
  }
}
