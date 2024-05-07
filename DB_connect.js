const sql = require('mssql/msnodesqlv8')

const config = {
    server : 'FLUTTER3\\SQLEXPRESS',
    database: 'employees',
    driver : 'msnodesqlv8',
    user : 'parth',
    password : '1234',
    options: {
        trustedConnection : true
    }
  };
  
async function DB_connection() {
    try {
        const result = await sql.connect(config);
        console.log('DB connected');
    } catch (error) {
        console.log('DB connection error:', error);
    }
}

module.exports = {DB_connection}