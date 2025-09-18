const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteAllUsers() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create database connection
    connection = await mysql.createConnection({
        host: "92.113.22.53",
        port: 3306,
        user: "u354738377_deaconschool",
        password: "@6pv7BOIvC",
        database: "u354738377_deaconschool",
        charset: "utf8mb4",
    });

    console.log('Connected to database');

    // First, let's get a count of users before deletion
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const userCount = countResult[0].count;
    
    console.log(`Found ${userCount} users in the database`);
    
    if (userCount === 0) {
      console.log('No users found to delete!');
      return;
    }

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL users from the database!');
    console.log('This action cannot be undone.');
    console.log('\nTo confirm deletion, you need to run this script with --confirm flag:');
    console.log('npm run delete-all-users -- --confirm');
    
    // Check if --confirm flag is passed
    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('\n❌ Deletion cancelled. Use --confirm flag to proceed.');
      return;
    }

    console.log('\n🗑️  Proceeding with user deletion...');

    // Disable foreign key checks to avoid constraint issues
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('Disabled foreign key checks');

    // Delete all users
    const [result] = await connection.execute('DELETE FROM users');
    console.log(`✅ Successfully deleted ${result.affectedRows} users`);

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Re-enabled foreign key checks');

    // Verify deletion
    const [verifyResult] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const remainingUsers = verifyResult[0].count;
    
    if (remainingUsers === 0) {
      console.log('✅ All users have been successfully deleted!');
    } else {
      console.log(`⚠️  Warning: ${remainingUsers} users still remain in the database`);
    }

  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
deleteAllUsers()
  .then(() => {
    console.log('User deletion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('User deletion failed:', error);
    process.exit(1);
  });
