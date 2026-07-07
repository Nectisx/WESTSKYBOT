if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquante — configure une base PostgreSQL (Neon, Supabase…).');
  process.exit(1);
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Installer les dépendances si absentes (hébergeurs sans npm install automatique)
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 node_modules absent — installation des dépendances...');
  try {
    execSync('npm install --omit=dev', { stdio: 'inherit' });
  } catch (e) {
    console.error('Erreur npm install:', e.message);
    process.exit(1);
  }
}

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma generate:', e.message);
  process.exit(1);
}

try {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma db push:', e.message);
  process.exit(1);
}

require('./src/index.js');
