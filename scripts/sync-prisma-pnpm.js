const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const generatedPrismaDir = path.join(projectRoot, 'node_modules', '.prisma');
const pnpmStoreDir = path.join(projectRoot, 'node_modules', '.pnpm');

if (!fs.existsSync(generatedPrismaDir) || !fs.existsSync(pnpmStoreDir)) {
  process.exit(0);
}

const prismaPackageDirs = fs
  .readdirSync(pnpmStoreDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('@prisma+client@'))
  .map((entry) => path.join(pnpmStoreDir, entry.name, 'node_modules', '.prisma'));

for (const targetDir of prismaPackageDirs) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(generatedPrismaDir, targetDir, { recursive: true });
}

if (prismaPackageDirs.length > 0) {
  console.log(`Synced Prisma client into ${prismaPackageDirs.length} pnpm path(s).`);
}
