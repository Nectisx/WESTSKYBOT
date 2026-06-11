process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./data.db';

const { execSync } = require('child_process');

try {
  execSync('node_modules/.bin/prisma generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma generate:', e.message);
  process.exit(1);
}

try {
  execSync('node_modules/.bin/prisma db push --skip-generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma db push:', e.message);
  process.exit(1);
}

try {
  execSync('node src/commands/deploy.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur deploy commands:', e.message);
  // On continue même si le déploiement échoue
}

require('./src/index.js');
