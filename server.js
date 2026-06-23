const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - Query:`, req.query);
  next();
});

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'bkksqrrfa1pneuqlzcyc-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'ugdkxrqhm2hyhcmh',
  password: process.env.DB_PASSWORD || '7bf1wZMIub8rUJcyKB3Z',
  database: process.env.DB_NAME || 'bkksqrrfa1pneuqlzcyc',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 3,
  idleTimeout: 5000,
  queueLimit: 0
});

// API Endpoint: Get all cars
app.get('/api/cars', async (req, res) => {
  try {
    const [cars] = await pool.query('SELECT * FROM cars');
    
    // Fetch colors for each car
    for (let car of cars) {
      const [colors] = await pool.query('SELECT color_name, color_hex, image_url FROM colors WHERE car_id = ?', [car.id]);
      car.colors = colors;
    }
    
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint: Get single car details
app.get('/api/cars/:id', async (req, res) => {
  const carId = parseInt(req.params.id);
  try {
    const [cars] = await pool.query('SELECT * FROM cars WHERE id = ?', [carId]);
    if (cars.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    const car = cars[0];
    const [colors] = await pool.query('SELECT color_name, color_hex, image_url FROM colors WHERE car_id = ?', [car.id]);
    car.colors = colors;
    
    res.json(car);
  } catch (error) {
    console.error('Error fetching car details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint: Get showrooms/branches
app.get('/api/branches', async (req, res) => {
  try {
    const [branches] = await pool.query('SELECT * FROM branches');
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint: Save a test drive booking (updated to support user_id)
app.post('/api/test-drive', async (req, res) => {
  const { booking_id, user_id, car_id, car_name, color_name, color_code, dealer, date_string, time_slot, fullname, phone } = req.body;
  
  if (!booking_id || !fullname || !phone) {
    return res.status(400).json({ error: 'Missing required booking parameters' });
  }
  
  try {
    await pool.query(
      `INSERT INTO test_drives (booking_id, user_id, car_id, car_name, color_name, color_code, dealer, date_string, time_slot, fullname, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [booking_id, user_id || null, car_id || null, car_name, color_name, color_code, dealer, date_string, time_slot, fullname, phone]
    );
    res.status(201).json({ success: true, booking_id });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Member Registration API
app.post('/api/register', async (req, res) => {
  const { username, password, fullname, phone, email } = req.body;
  
  if (!username || !password || !fullname || !phone) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    // Check if username exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'มีชื่อผู้ใช้นี้ในระบบแล้ว' });
    }
    
    const hashedPassword = hashPassword(password);
    await pool.query(
      'INSERT INTO users (username, password, fullname, phone, email) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, fullname, phone, email || null]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error in /api/register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Member Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  
  try {
    const hashedPassword = hashPassword(password);
    const [users] = await pool.query(
      'SELECT id, username, fullname, phone, email FROM users WHERE username = ? AND password = ?',
      [username, hashedPassword]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    
    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Member Bookings (Ticket list) API
app.get('/api/my-bookings', async (req, res) => {
  const userId = parseInt(req.query.user_id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid or missing user_id' });
  }
  
  try {
    const [bookings] = await pool.query(
      'SELECT * FROM test_drives WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error in /api/my-bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint: Save a contact message
app.post('/api/contact', async (req, res) => {
  const { name, phone, topic, message } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing required name or phone parameter' });
  }
  
  try {
    await pool.query(
      `INSERT INTO contacts (name, phone, topic, message) VALUES (?, ?, ?, ?)`,
      [name, phone, topic || null, message || null]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint: Record visit and get unique visitor count
app.get('/api/visit', async (req, res) => {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  try {
    await pool.query('INSERT IGNORE INTO visits (ip_address) VALUES (?)', [ip]);
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM visits');
    const baseOffset = 0;
    res.json({ visits: baseOffset + count });
  } catch (error) {
    console.error('Error logging visit:', error);
    res.json({ visits: 0 });
  }
});

// HTML Routers to support pretty URLs (without .html extension)
app.get('/detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'detail.html'));
});

app.get('/compare', (req, res) => {
  res.sendFile(path.join(__dirname, 'compare.html'));
});

app.get('/techno', (req, res) => {
  res.sendFile(path.join(__dirname, 'techno.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Fallback HTML router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Honda Showroom server running at http://localhost:${PORT}`);
});
