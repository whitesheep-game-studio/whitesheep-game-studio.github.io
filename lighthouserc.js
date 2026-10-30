export default {
  ci: {
    collect: { staticDistDir: './docs', url: ['http://localhost/','http://localhost/apps/'], numberOfRuns: 1, settings: { chromeFlags: '--no-sandbox' } },
    assert: { assertions: { 'categories:performance': ['warn', { minScore: 0.7 }], 'categories:accessibility': ['warn', { minScore: 0.8 }], 'categories:best-practices': ['warn', { minScore: 0.8 }], 'categories:seo': ['warn', { minScore: 0.8 }] } },
    upload: { target: 'temporary-public-storage' }
  }
};
