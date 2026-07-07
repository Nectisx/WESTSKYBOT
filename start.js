if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquante — configure une base PostgreSQL (Railway : Add Service → PostgreSQL).');
  process.exit(1);
}

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

require('./src/index.js');
