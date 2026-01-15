// Project Renderer - Renders project cards in the DOM
// Handles loading states, error messages, and project card creation

/**
 * ProjectRenderer class for rendering project cards
 */
export class ProjectRenderer {
  /**
   * Create a ProjectRenderer
   * @param {string} containerSelector - CSS selector for the project container
   */
  constructor(containerSelector) {
    this.containerSelector = containerSelector;
    this.container = null;
  }

  /**
   * Initialize the renderer by finding the container element
   * @returns {boolean} True if container found, false otherwise
   */
  initialize() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) {
      console.error(`Container not found: ${this.containerSelector}`);
      return false;
    }
    return true;
  }

  /**
   * Render projects as cards in the container
   * @param {Array} projects - Array of project objects to render
   */
  render(projects) {
    if (!this.container) {
      if (!this.initialize()) {
        console.error('Cannot render: container not found');
        return;
      }
    }

    // Clear existing content
    this.container.innerHTML = '';

    // Handle empty projects array
    if (!projects || projects.length === 0) {
      this.showEmpty();
      return;
    }

    // Create and append project cards
    projects.forEach(project => {
      const card = this.createProjectCard(project);
      if (card) {
        this.container.appendChild(card);
      }
    });
  }

  /**
   * Create a project card element
   * @param {Object} project - Project object
   * @returns {HTMLElement} Project card element
   */
  createProjectCard(project) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-project-id', project.id);

    // Create thumbnail section
    const thumbnail = this.createThumbnail(project);
    card.appendChild(thumbnail);

    // Create content section
    const content = document.createElement('div');
    content.className = 'project-content';

    // Project name
    const name = document.createElement('h3');
    name.className = 'project-name';
    name.textContent = project.name;
    content.appendChild(name);

    // Project description
    const description = document.createElement('p');
    description.className = 'project-description';
    description.textContent = project.description || 'No description available';
    content.appendChild(description);

    // Project topics/tags
    if (project.topics && project.topics.length > 0) {
      const topics = this.createTopics(project.topics);
      content.appendChild(topics);
    }

    // Project links
    const links = this.createLinks(project);
    content.appendChild(links);

    card.appendChild(content);

    return card;
  }

  /**
   * Create thumbnail element for project
   * @param {Object} project - Project object
   * @returns {HTMLElement} Thumbnail element
   */
  createThumbnail(project) {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'project-thumbnail';

    if (project.thumbnail && project.thumbnail.trim() !== '') {
      // Use custom thumbnail if provided
      const img = document.createElement('img');
      img.src = project.thumbnail;
      img.alt = `${project.name} thumbnail`;
      img.className = 'project-thumbnail-img';
      
      // Handle image load errors
      img.onerror = () => {
        img.style.display = 'none';
        thumbnailContainer.appendChild(this.createPlaceholder(project));
      };
      
      thumbnailContainer.appendChild(img);
    } else {
      // Use placeholder with URL
      thumbnailContainer.appendChild(this.createPlaceholder(project));
    }

    return thumbnailContainer;
  }

  /**
   * Create placeholder element for projects without thumbnails
   * @param {Object} project - Project object
   * @returns {HTMLElement} Placeholder element
   */
  createPlaceholder(project) {
    const placeholder = document.createElement('div');
    placeholder.className = 'project-placeholder';
    
    // Create gradient based on project name (deterministic)
    const hash = this.hashString(project.name);
    const hue1 = hash % 360;
    const hue2 = (hash + 60) % 360;
    placeholder.style.background = `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`;
    
    // Extract domain from URL for display
    const urlDisplay = this.extractDomain(project.liveUrl);
    
    // Add URL text
    const urlText = document.createElement('div');
    urlText.className = 'project-url-display';
    urlText.textContent = urlDisplay;
    placeholder.appendChild(urlText);

    return placeholder;
  }

  /**
   * Extract domain from URL for display
   * @param {string} url - Full URL
   * @returns {string} Domain or simplified URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      
      // Remove 'www.' prefix if present
      domain = domain.replace(/^www\./, '');
      
      // For GitHub pages, show the repo name
      if (domain.includes('github.io')) {
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          // Show username.github.io/repo
          return `${domain}/${pathParts[0]}`;
        }
        return domain;
      }
      
      // For Vercel apps, show the full subdomain
      if (domain.endsWith('.vercel.app')) {
        return domain;
      }
      
      return domain;
    } catch (error) {
      // If URL parsing fails, return a cleaned version
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('?')[0].replace(/\/$/, '');
    }
  }

  /**
   * Simple string hash function for generating consistent colors
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Create topics/tags element
   * @param {Array} topics - Array of topic strings
   * @returns {HTMLElement} Topics container element
   */
  createTopics(topics) {
    const container = document.createElement('div');
    container.className = 'project-topics';

    topics.slice(0, 5).forEach(topic => {
      const tag = document.createElement('span');
      tag.className = 'project-topic';
      tag.textContent = topic;
      container.appendChild(tag);
    });

    return container;
  }

  /**
   * Create links section for project
   * @param {Object} project - Project object
   * @returns {HTMLElement} Links container element
   */
  createLinks(project) {
    const container = document.createElement('div');
    container.className = 'project-links';

    // Live demo link (primary)
    const liveLink = document.createElement('a');
    liveLink.href = project.liveUrl;
    liveLink.target = '_blank';
    liveLink.rel = 'noopener noreferrer';
    liveLink.className = 'project-link project-link-primary';
    liveLink.textContent = 'View Project';
    container.appendChild(liveLink);

    // GitHub repo link (secondary)
    if (project.repoUrl && project.repoUrl !== project.liveUrl) {
      const repoLink = document.createElement('a');
      repoLink.href = project.repoUrl;
      repoLink.target = '_blank';
      repoLink.rel = 'noopener noreferrer';
      repoLink.className = 'project-link project-link-secondary';
      repoLink.textContent = 'View Code';
      container.appendChild(repoLink);
    }

    return container;
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    if (!this.container) {
      if (!this.initialize()) {
        return;
      }
    }

    this.container.innerHTML = `
      <div class="projects-loading">
        <div class="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    `;
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.container) {
      if (!this.initialize()) {
        return;
      }
    }

    this.container.innerHTML = `
      <div class="projects-error">
        <p class="error-message">${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Show empty state message
   */
  showEmpty() {
    if (!this.container) {
      if (!this.initialize()) {
        return;
      }
    }

    this.container.innerHTML = `
      <div class="projects-empty">
        <p>No projects to display</p>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
