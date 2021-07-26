import { exec } from 'child_process';

export async function createDB() {
  await new Promise<void>((resolve, reject) => {
    const migrate = exec('npm run test:db:create', { env: process.env }, (err) => (err ? reject(err) : resolve()));
    migrate.stdout.pipe(process.stdout);
    migrate.stderr.pipe(process.stderr);
  });
}

export async function migrateDB() {
  await new Promise<void>((resolve, reject) => {
    const migrate = exec('npm run test:db:migrate', { env: process.env }, (err) => (err ? reject(err) : resolve()));
    migrate.stdout.pipe(process.stdout);
    migrate.stderr.pipe(process.stderr);
  });
}

export async function dropDB() {
  await new Promise<void>((resolve, reject) => {
    const migrate = exec('npm run test:db:drop', { env: process.env }, (err) => (err ? reject(err) : resolve()));
    migrate.stdout.pipe(process.stdout);
    migrate.stderr.pipe(process.stderr);
  });
}
