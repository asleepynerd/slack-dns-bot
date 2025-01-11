const { readUserData } = require('./storage');

const getDomainStats = async () => {
  const userData = await readUserData();
  const stats = {
    total: 0,
    perDomain: {}
  };

  Object.values(userData).forEach(user => {
    user.domains?.forEach(domain => {
      stats.total++;
      const baseDomain = domain.domain.split('.').slice(-2).join('.');
      stats.perDomain[baseDomain] = (stats.perDomain[baseDomain] || 0) + 1;
    });
  });

  const mostPopular = Object.entries(stats.perDomain)
    .sort(([,a], [,b]) => b - a)[0] || [];

  return {
    totalSubdomains: stats.total,
    mostPopular: {
      domain: mostPopular[0] || 'None',
      count: mostPopular[1] || 0
    },
    perDomain: stats.perDomain
  };
};

module.exports = { getDomainStats };