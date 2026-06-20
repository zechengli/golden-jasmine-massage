# Golden Jasmine Massage Booking System

A simple local appointment booking website for Golden Jasmine Massage.

## Address
233N 48th Street Suite T, Lincoln, NE 68504

## Prices
- 30 min: $40
- 45 min: $50
- 60 min: $60
- 90 min: $90
- 120 min: $120

Foot Massage and Reflexology same price. Hot Stone Massage +$10 on all durations.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open the booking page:
```
http://localhost:3000
```

4. Open the admin dashboard:
```
http://localhost:3000/admin
```

## Features
- Customer booking by name and phone
- Service and duration selection with live price
- Time slots from 8:00 AM to 8:00 PM, every 30 minutes
- 2 therapists per time slot
- Admin dashboard shows appointment list with date filter and revenue summary
- SQLite database stored locally in `appointments.db`
