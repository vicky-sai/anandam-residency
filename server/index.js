import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 8787;

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'GMAIL_ACCOUNT', 'GMAIL_APP_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

function normalizeSupabaseUrl(value) {
  if (!value) return value;
  const parsed = new URL(value);
  parsed.pathname = parsed.pathname.replace(/\/rest\/v1\/?$/, '/') || '/';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

const supabaseUrl = missingEnv.includes('SUPABASE_URL') ? '' : normalizeSupabaseUrl(process.env.SUPABASE_URL);

const supabase = missingEnv.includes('SUPABASE_URL') || missingEnv.includes('SUPABASE_SECRET_KEY')
  ? null
  : createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false }
    });

const mailer = missingEnv.includes('GMAIL_ACCOUNT') || missingEnv.includes('GMAIL_APP_PASSWORD')
  ? null
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ACCOUNT,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const ROOM_COUNT = 28;

function dateRange(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = [];

  for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
    days.push(day.toISOString().slice(0, 10));
  }

  return days;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function validateRoomBooking(body) {
  const required = ['guest_name', 'email', 'phone', 'check_in', 'check_out', 'rooms_requested'];
  const missing = required.filter((key) => !body[key]);

  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!isValidEmail(body.email)) return 'Please provide a valid email address.';
  if (Number(body.rooms_requested) < 1 || Number(body.rooms_requested) > ROOM_COUNT) return 'Rooms requested must be between 1 and 28.';
  if (new Date(body.check_in) >= new Date(body.check_out)) return 'Check-out must be after check-in.';
  return null;
}

function validateBanquetBooking(body) {
  const required = ['guest_name', 'email', 'phone', 'event_date', 'event_type', 'guest_count'];
  const missing = required.filter((key) => !body[key]);

  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (!isValidEmail(body.email)) return 'Please provide a valid email address.';
  if (Number(body.guest_count) < 1) return 'Guest count must be at least 1.';
  return null;
}

async function getRoomAvailability(start, end) {
  const days = dateRange(start, end);

  if (!days.length) {
    return {
      start,
      end,
      totalRooms: ROOM_COUNT,
      days: []
    };
  }

  const { data, error } = await supabase
    .from('room_bookings')
    .select('check_in, check_out, rooms_requested, status')
    .in('status', ['pending', 'confirmed'])
    .lt('check_in', end)
    .gt('check_out', start);

  if (error) throw error;

  const usage = Object.fromEntries(days.map((day) => [day, 0]));

  for (const booking of data || []) {
    for (const day of days) {
      if (booking.check_in <= day && booking.check_out > day) {
        usage[day] += Number(booking.rooms_requested || 0);
      }
    }
  }

  return {
    start,
    end,
    totalRooms: ROOM_COUNT,
    days: days.map((day) => ({
      date: day,
      booked: usage[day],
      available: Math.max(ROOM_COUNT - usage[day], 0)
    }))
  };
}

async function sendConfirmation(type, payload) {
  if (!mailer) return;

  const isRoom = type === 'room';
  const subject = isRoom
    ? 'Anandam Residency room booking request received'
    : 'Anandam Residency banquet enquiry received';

  const details = isRoom
    ? `
      <p><strong>Stay:</strong> ${payload.check_in} to ${payload.check_out}</p>
      <p><strong>Rooms:</strong> ${payload.rooms_requested}</p>
      <p><strong>Guests:</strong> ${payload.adults || 1} adults, ${payload.children || 0} children</p>
    `
    : `
      <p><strong>Event:</strong> ${payload.event_type}</p>
      <p><strong>Date:</strong> ${payload.event_date}</p>
      <p><strong>Guests:</strong> ${payload.guest_count}</p>
      <p><strong>Spaces:</strong> ${(payload.spaces || []).join(', ') || 'To be decided'}</p>
    `;

  const html = `
    <div style="font-family: Georgia, serif; color: #213f1b; line-height: 1.6;">
      <h2 style="color: #9b762d;">Anandam Residency</h2>
      <p>Dear ${payload.guest_name},</p>
      <p>We have received your ${isRoom ? 'room booking request' : 'banquet enquiry'}.</p>
      ${details}
      <p>Our team will call you at ${payload.phone} to confirm availability, rates, and payment details.</p>
      <p>Phone: +91 8787878787</p>
    </div>
  `;

  await mailer.sendMail({
    from: `"Anandam Residency" <${process.env.GMAIL_ACCOUNT}>`,
    to: payload.email,
    bcc: process.env.GMAIL_ACCOUNT,
    subject,
    html
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    missingEnv,
    supabase: Boolean(supabase),
    mailer: Boolean(mailer)
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    defaultLocation: {
      lat: Number(process.env.HOTEL_LAT || 28.6084),
      lng: Number(process.env.HOTEL_LNG || 77.4452)
    }
  });
});

app.get('/api/availability', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase environment variables are missing.' });

    const today = new Date().toISOString().slice(0, 10);
    const fallbackEnd = new Date();
    fallbackEnd.setDate(fallbackEnd.getDate() + 30);

    const start = req.query.start || today;
    const end = req.query.end || fallbackEnd.toISOString().slice(0, 10);
    const availability = await getRoomAvailability(start, end);

    const { data: banquetEvents, error } = await supabase
      .from('banquet_bookings')
      .select('event_date, event_type, status')
      .in('status', ['pending', 'confirmed'])
      .gte('event_date', start)
      .lte('event_date', end);

    if (error) throw error;

    res.json({
      ...availability,
      banquetEvents: banquetEvents || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings/rooms', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase environment variables are missing.' });

    const errorMessage = validateRoomBooking(req.body);
    if (errorMessage) return res.status(400).json({ error: errorMessage });

    const availability = await getRoomAvailability(req.body.check_in, req.body.check_out);
    const lowestAvailability = Math.min(...availability.days.map((day) => day.available));

    if (lowestAvailability < Number(req.body.rooms_requested)) {
      return res.status(409).json({
        error: `Only ${lowestAvailability} rooms are available for at least one selected night.`
      });
    }

    const booking = {
      guest_name: req.body.guest_name,
      email: req.body.email,
      phone: req.body.phone,
      check_in: req.body.check_in,
      check_out: req.body.check_out,
      rooms_requested: Number(req.body.rooms_requested),
      adults: Number(req.body.adults || 1),
      children: Number(req.body.children || 0),
      notes: req.body.notes || null,
      status: 'pending'
    };

    const { data, error } = await supabase.from('room_bookings').insert(booking).select().single();
    if (error) throw error;

    await sendConfirmation('room', booking);
    res.status(201).json({ booking: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings/banquet', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase environment variables are missing.' });

    const errorMessage = validateBanquetBooking(req.body);
    if (errorMessage) return res.status(400).json({ error: errorMessage });

    const booking = {
      guest_name: req.body.guest_name,
      email: req.body.email,
      phone: req.body.phone,
      event_date: req.body.event_date,
      event_type: req.body.event_type,
      guest_count: Number(req.body.guest_count),
      spaces: req.body.spaces || [],
      catering_required: Boolean(req.body.catering_required),
      notes: req.body.notes || null,
      status: 'pending'
    };

    const { data, error } = await supabase.from('banquet_bookings').insert(booking).select().single();
    if (error) throw error;

    await sendConfirmation('banquet', booking);
    res.status(201).json({ booking: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enquiries', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase environment variables are missing.' });
    if (!req.body.name || !req.body.phone || !req.body.message) {
      return res.status(400).json({ error: 'Name, phone, and message are required.' });
    }

    const enquiry = {
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone,
      enquiry_type: req.body.enquiry_type || 'general',
      message: req.body.message,
      status: 'new'
    };

    const { data, error } = await supabase.from('enquiries').insert(enquiry).select().single();
    if (error) throw error;

    if (mailer) {
      await mailer.sendMail({
        from: `"Anandam Residency" <${process.env.GMAIL_ACCOUNT}>`,
        to: process.env.GMAIL_ACCOUNT,
        subject: `New Anandam Residency enquiry: ${enquiry.enquiry_type}`,
        text: `${enquiry.name}\n${enquiry.phone}\n${enquiry.email || ''}\n\n${enquiry.message}`
      });
    }

    res.status(201).json({ enquiry: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Anandam Residency API running on http://localhost:${port}`);
  if (missingEnv.length) {
    console.log(`Missing environment variables: ${missingEnv.join(', ')}`);
  }
});
