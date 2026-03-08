/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');

async function main() {
  // Trying to connect as superuser postgres without password first
  // allow providing superuser credentials via separate env vars to avoid URL encoding problems
  const superUser = process.env.SUPER_USER || 'postgres';
  const superHost = process.env.SUPER_HOST || 'localhost';
  const superPort = process.env.SUPER_PORT || 5432;
  const superDb = process.env.SUPER_DB || 'postgres';
  const superPass = process.env.SUPER_PASS || '';
  const clientConfig = {
    user: superUser,
    host: superHost,
    database: superDb,
    port: superPort,
  };
  if (superPass && superPass.length > 0) {
    clientConfig.password = superPass;
  }
  const client = new Client(clientConfig);
  try {
    await client.connect();
    console.log('Connected as superuser.');

    // create user and database
    const user = 'drawcode';
    const pass = '@@11042009gSa';
    const db = 'drawcode_db';

    // optionally drop user and database when resetting
    if (process.env.RESET_DB === '1') {
      // terminate other connections to allow dropping
      await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db}';`);
      await client.query(`DROP DATABASE IF EXISTS ${db};`);
      console.log('Dropped existing database.');
      await client.query(`DROP ROLE IF EXISTS ${user};`);
      console.log('Dropped existing user.');
    }
    await client.query(`CREATE USER ${user} WITH PASSWORD '${pass}';`).catch(e => {
      if (e.code === '23505') {
        console.log('User already exists');
      } else {
        throw e;
      }
    });
    await client.query(`CREATE DATABASE ${db} OWNER ${user};`).catch(e => {
      if (e.code === '42P04') {
        console.log('Database already exists');
      } else {
        throw e;
      }
    });
    console.log('User and database created or already existed.');
  } catch (err) {
    console.error('Failed to setup DB:', err.message);
  } finally {
    await client.end();
  }
}

main();
