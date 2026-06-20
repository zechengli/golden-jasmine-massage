const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'appointments.db'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const BASE_PRICES = { 30: 40, 45: 50, 60: 60, 90: 90, 120: 120 };
const SERVICES = ['Massage', 'Foot Massage', 'Reflexology'];
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;
const THERAPIST_COUNT = 2;

function getPrice(service, duration) {
  let price = BASE_PRICES[duration] || 0;
  if (service === 'Hot Stone Massage') price += 10;
  return price;
}

function generateTimeSlots(dateStr) {
  const slots = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
}

function getOccupancy(dateStr) {
  const rows = db.prepare('SELECT time, COUNT(*) as count FROM appointments WHERE date = ? GROUP BY time').all(dateStr);
  const occupancy = {};
  for (const row of rows) occupancy[row.time] = row.count;
  return occupancy;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.get('/api/services', (req, res) => {
  const services = SERVICES.map(s => ({
    name: s,
    hotStone: false,
    durations: DURATION_OPTIONS.map(d => ({ duration: d, price: getPrice(s, d) }))
  }));
  services.push({
    name: 'Hot Stone Massage',
    hotStone: true,
    durations: DURATION_OPTIONS.map(d => ({ duration: d, price: getPrice('Hot Stone Massage', d) }))
  });
  res.json(services);
});

app.get('/api/slots', (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Date required' });
  const slots = generateTimeSlots(date);
  const occupancy = getOccupancy(date);
  res.json(slots.map(time => ({
    time,
    available: (occupancy[time] || 0) < THERAPIST_COUNT,
    booked: occupancy[time] || 0
  })));
});

app.post('/api/book', (req, res) => {
  const { name, phone, service, duration, date, time } = req.body;
  if (!name || !phone || !service || !duration || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const occupancy = getOccupancy(date);
  if ((occupancy[time] || 0) >= THERAPIST_COUNT) {
    return res.status(409).json({ error: 'This time slot is fully booked' });
  }

  const price = getPrice(service, parseInt(duration));
  const stmt = db.prepare(
    'INSERT INTO appointments (name, phone, service, duration, price, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, phone, service, parseInt(duration), price, date, time);
  res.json({ success: true, id: result.lastInsertRowid, price });
});

app.get('/api/appointments', (req, res) => {
  const date = req.query.date;
  let rows;
  if (date) {
    rows = db.prepare('SELECT * FROM appointments WHERE date = ? ORDER BY time').all(date);
  } else {
    rows = db.prepare('SELECT * FROM appointments ORDER BY date, time').all();
  }
  res.json(rows);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Golden Jasmine Massage booking site running at http://localhost:${PORT}`);
});
