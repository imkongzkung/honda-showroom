const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'bkksqrrfa1pneuqlzcyc-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'ugdkxrqhm2hyhcmh',
  password: process.env.DB_PASSWORD || '7bf1wZMIub8rUJcyKB3Z',
  database: process.env.DB_NAME || 'bkksqrrfa1pneuqlzcyc',
  port: parseInt(process.env.DB_PORT || '3306')
};

function cleanSqlComments(sql) {
  // Remove block comments /* ... */
  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split into lines, filter out lines that start with -- (comments)
  let lines = cleaned.split('\n');
  lines = lines.filter(line => !line.trim().startsWith('--'));
  
  return lines.join('\n');
}

async function importColors() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected!');

    // Read colors.sql
    const sqlFilePath = 'C:/Users/imkon/Downloads/colors.sql';
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`File not found at ${sqlFilePath}`);
      return;
    }
    const rawSqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const sqlContent = cleanSqlComments(rawSqlContent);

    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Dropping existing colors table...');
    await connection.query('DROP TABLE IF EXISTS colors');

    console.log('Parsing and executing colors.sql...');
    
    // Split the SQL file by semicolons to execute statements individually.
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (let statement of statements) {
      console.log(`Executing statement: ${statement.substring(0, 80)}...`);
      await connection.query(statement);
    }

    console.log('Enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Colors imported successfully into Clever Cloud Database!');
    
    // Fetch the new colors and update database.js and init-db.js!
    const [rows] = await connection.query('SELECT * FROM colors');
    console.log(`Retrieved ${rows.length} color entries from database.`);

    const databaseJsPath = 'D:/Workhonda/database.js';
    const initDbPath = 'D:/Workhonda/init-db.js';

    // Group rows by car_id
    const colorsByCar = {};
    rows.forEach(row => {
      if (!colorsByCar[row.car_id]) {
        colorsByCar[row.car_id] = [];
      }
      colorsByCar[row.car_id].push({
        color_name: row.color_name,
        color_hex: row.color_hex,
        image_url: row.image_url
      });
    });

    // Update database.js
    if (fs.existsSync(databaseJsPath)) {
      let databaseJsContent = fs.readFileSync(databaseJsPath, 'utf8');
      
      const sandbox = { window: {} };
      const vm = require('vm');
      vm.createContext(sandbox);
      vm.runInContext(databaseJsContent, sandbox);

      if (sandbox.window.CAR_DATABASE) {
        sandbox.window.CAR_DATABASE.forEach(car => {
          if (colorsByCar[car.id]) {
            car.colors = colorsByCar[car.id];
          }
        });

        // Format and reconstruct databaseJsContent
        const newDbJsContent = `// Honda Cars Database with verified specs (Displacement, HP, Torque, Consumption)\n` +
          `window.CAR_DATABASE = ${JSON.stringify(sandbox.window.CAR_DATABASE, null, 2)};\n\n` +
          `// Showrooms database\n` +
          `window.BRANCH_DATABASE = ${JSON.stringify(sandbox.window.BRANCH_DATABASE, null, 2)};\n`;

        fs.writeFileSync(databaseJsPath, newDbJsContent, 'utf8');
        console.log('database.js updated successfully!');
      }
    }

    // Update init-db.js CARS array to keep in sync
    if (fs.existsSync(initDbPath)) {
      let initDbContent = fs.readFileSync(initDbPath, 'utf8');
      
      const carsMatch = initDbContent.match(/const CARS = (\[[\s\S]*?\]);/);
      
      if (carsMatch) {
        const sandbox = { module: {}, require: () => {} };
        const vm = require('vm');
        vm.createContext(sandbox);
        const carsObj = vm.runInContext(`(${carsMatch[1]})`, sandbox);
        carsObj.forEach(car => {
          if (colorsByCar[car.id]) {
            car.colors = colorsByCar[car.id];
          }
        });

        const newCarsStr = `const CARS = ${JSON.stringify(carsObj, null, 2)};`;
        initDbContent = initDbContent.replace(/const CARS = \[[\s\S]*?\];/, newCarsStr);
        fs.writeFileSync(initDbPath, initDbContent, 'utf8');
        console.log('init-db.js updated successfully!');
      }
    }

  } catch (error) {
    console.error('Error importing colors:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importColors();
