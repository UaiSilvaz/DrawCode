/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
(async()=>{
  const client = new Client({
    user:'drawcode', host:'localhost', database:'drawcode_db', password:'@@11042009gSa', port:5432
  });
  await client.connect();
  const res = await client.query("SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname='public';");
  console.log(res.rows);
  await client.end();
})();
