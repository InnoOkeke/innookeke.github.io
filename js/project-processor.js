// Project Processor - Handles filtering, sorting, and processing of project data
// Applies configuration rules to transform raw project data

/**
 * Filter out excluded repositories (but keep manual projects)
 * @param {Array} projects - Array of project objects
 * @param {Array} excludeList - Array of repository names to exclude
 * @returns {Array} Filtered array
 */
export function filterExcluded(projects, excludeList = []) {
  if (!Array.isArray(excludeList) || excludeList.length === 0) {
    return projects;
  }

  // Create a Set for O(1) lookup
  const excludeSet = new Set(excludeList.map(name => name.toLowerCase()));

  return projects.filter(project => {
    const projectName = project.name.toLowerCase();
    
    // Keep manual projects even if they're in the exclude list
    if (project.source === 'manual') {
      return true;
    }
    
    // Filter out GitHub projects that are in the exclude list
    return !excludeSet.has(projectName);
  });
}

/**
 * Sort projects by priority, then by update time
 * @param {Array} projects - Array of project objects
 * @param {Array} priorityList - Array of repository names to prioritize
 * @returns {Array} Sorted array
 */
export function sortByPriority(projects, priorityList = []) {
  if (!Array.isArray(priorityList) || priorityList.length === 0) {
    // No priority list, just sort by update time
    return sortByUpdateTime(projects);
  }

  // Create a Set for O(1) lookup and mark priority projects
  const prioritySet = new Set(priorityList.map(name => name.toLowerCase()));
  
  // Mark projects as priority
  const markedProjects = projects.map(project => ({
    ...project,
    isPriority: prioritySet.has(project.name.toLowerCase())
  }));

  // Sort: priority projects first (by update time), then non-priority (by update time)
  return markedProjects.sort((a, b) => {
    // First, sort by priority status
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;

    // Within same priority level, sort by update time (most recent first)
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);
    return dateB - dateA;
  });
}

/**
 * Sort projects by update time (most recent first)
 * @param {Array} projects - Array of project objects
 * @returns {Array} Sorted array
 */
function sortByUpdateTime(projects) {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);
    return dateB - dateA;
  });
}

/**
 * Limit the number of projects
 * @param {Array} projects - Array of project objects
 * @param {number} maxCount - Maximum number of projects to return
 * @returns {Array} Limited array
 */
export function limitProjects(projects, maxCount) {
  if (!maxCount || maxCount <= 0 || !Number.isFinite(maxCount)) {
    return projects;
  }

  return projects.slice(0, maxCount);
}

/**
 * Process projects with all filtering, sorting, and limiting steps
 * @param {Array} projects - Array of project objects
 * @param {Object} config - Configuration object
 * @returns {Array} Processed array
 */
export function processProjects(projects, config = {}) {
  let processed = [...projects];
  
  console.log('processProjects - Input:', processed.length, 'projects');
  console.log('Projects:', processed.map(p => ({ name: p.name, source: p.source })));

  // Step 1: Filter out excluded repositories
  if (config.excludeRepos) {
    processed = filterExcluded(processed, config.excludeRepos);
    console.log('After filterExcluded:', processed.length, 'projects');
    console.log('Remaining:', processed.map(p => p.name));
  }

  // Step 2: Sort by priority and update time
  if (config.priorityRepos) {
    processed = sortByPriority(processed, config.priorityRepos);
    console.log('After sortByPriority:', processed.length, 'projects');
  } else {
    // Just sort by update time if no priority list
    processed = sortByUpdateTime(processed);
  }

  // Step 3: Limit to max projects
  if (config.maxProjects) {
    processed = limitProjects(processed, config.maxProjects);
    console.log('After limitProjects:', processed.length, 'projects (max:', config.maxProjects, ')');
  }

  return processed;
}
