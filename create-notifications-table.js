// Script to create the notifications table in the database
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createNotificationsTable() {
  try {
    const client = await pool.connect();
    try {
      console.log('Creating notifications table...');
      
      // Check if the table already exists
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
        );
      `);
      
      if (checkResult.rows[0].exists) {
        console.log('Notifications table already exists. Dropping and recreating it.');
        await client.query(`DROP TABLE notifications;`);
      }
      
      // Create the notifications table
      await client.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          link TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      
      console.log('Notifications table created successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating notifications table:', error);
  } finally {
    await pool.end();
  }
}

createNotificationsTable();