const { execSync } = require('child_process');

try {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma db push:', e.message);
  process.exit(1);
}

require('./src/index.js');
