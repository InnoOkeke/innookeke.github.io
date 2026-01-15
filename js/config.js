// Configuration for auto-fetch projects feature
// This file contains all configurable settings for fetching and displaying projects

export const config = {
  // GitHub username to fetch repositories from
  githubUsername: 'innookeke',
  
  // Vercel API token (optional - leave null if not using Vercel)
  // Note: For security, consider using a server-side proxy instead of exposing token
  vercelToken: null,
  
  // Vercel team ID (optional - only needed if using team account)
  vercelTeamId: null,
  
  // Repository names to exclude from display
  excludeRepos: [
    'innookeke.github.io',
    'kellon-home',
    'MeluriAINFT',
    'spectra-market',
    'kellon'
  ],
  
  // Repository names to display first (priority projects)
  priorityRepos: [
    'MeluriAINFT',
    'PropertyClique.ng',
    'kellon',
    'oweza',
    'spectra-market'
  ],
  
  // Maximum number of projects to display
  maxProjects: 10,
  
  // Cache expiry time in milliseconds (default: 1 hour)
  cacheExpiry: 3600000, // 1 hour = 60 * 60 * 1000
  
  // Cache version - increment this to force cache refresh
  cacheVersion: 9,
  
  // CSS selector for the project container
  containerSelector: '.projects',
  
  // Manual projects to merge with auto-fetched ones
  // These will be displayed alongside GitHub projects
  manualProjects: [
    {
      id: 'manual-meluri',
      name: 'MeluriAINFT',
      description: 'AI‑powered NFT generation and minting platform.',
      repoUrl: 'https://github.com/innookeke/MeluriAINFT',
      liveUrl: 'https://innookeke.github.io/MeluriAINFT/',
      thumbnail: '/images/meluri.png',
      topics: ['ai', 'nft', 'web3', 'blockchain'],
      updatedAt: new Date().toISOString(),
      isPriority: true,
      source: 'manual'
    },
    {
      id: 'manual-property',
      name: 'PropertyClique.ng',
      description: 'Modern real-estate marketplace for property discovery.',
      repoUrl: 'https://github.com/innookeke/PropertyClique.ng',
      liveUrl: 'https://propertyclique.ng',
      thumbnail: '/images/property.png',
      topics: ['real-estate', 'marketplace', 'web'],
      updatedAt: new Date().toISOString(),
      isPriority: true,
      source: 'manual'
    },
    {
      id: 'manual-kellon',
      name: 'kellon',
      description: 'Send and receive USDC/USDT on Stellar, Base and Celo.',
      repoUrl: 'https://github.com/innookeke/kellon',
      liveUrl: 'https://kellon.xyz',
      thumbnail: '/images/kellon.png',
      topics: ['web3', 'crypto', 'mobile', 'stellar', 'celo'],
      updatedAt: new Date().toISOString(),
      isPriority: true,
      source: 'manual'
    },
    {
      id: 'manual-spectra',
      name: 'spectra-market',
      description: 'Professional encrypted prediction markets.',
      repoUrl: 'https://github.com/innookeke/spectra-market',
      liveUrl: 'https://spectra-market.vercel.app/',
      thumbnail: '/images/spectra.png',
      topics: ['web3', 'prediction-market', 'encryption'],
      updatedAt: new Date().toISOString(),
      isPriority: true,
      source: 'manual'
    }
  ]
};
