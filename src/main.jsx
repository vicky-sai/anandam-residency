import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  ChefHat,
  ChevronRight,
  Clock,
  Flower2,
  Hotel,
  Mail,
  MapPin,
  Menu,
  PartyPopper,
  Phone,
  Sparkles,
  Sun,
  Utensils,
  X
} from 'lucide-react';
import './styles.css';

import photo1 from '../photos/1.jpg';
import photo2 from '../photos/2.jpeg';
import photo3 from '../photos/3.avif';
import photo4 from '../photos/4.avif';
import photo5 from '../photos/5.avif';
import photo6 from '../photos/6.avif';
import photo7 from '../photos/7.avif';
import photo8 from '../photos/8.avif';

const PHONE = '+91 8787878787';
const TOTAL_ROOMS = 28;

const photos = [
  { src: photo1, label: 'Hotel frontage' },
  { src: photo2, label: 'Guest rooms' },
  { src: photo3, label: 'Banquet setup' },
  { src: photo4, label: 'Dining service' },
  { src: photo5, label: 'Reception' },
  { src: photo6, label: 'Event decor' },
  { src: photo7, label: 'Terrace area' },
  { src: photo8, label: 'Hospitality spaces' }
];

const roomInitial = {
  guest_name: '',
  email: '',
  phone: '',
  check_in: '',
  check_out: '',
  rooms_requested: 1,
  adults: 2,
  children: 0,
  notes: ''
};

const banquetInitial = {
  guest_name: '',
  email: '',
  phone: '',
  event_date: '',
  event_type: 'Wedding',
  guest_count: 100,
  spaces: ['Banquet Hall'],
  catering_required: true,
  notes: ''
};

function addDays(date, count) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + count);
  return copy.toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(`${value}T00:00:00`));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong. Please try again.');
  }

  return payload;
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = ['Stay', 'Banquet', 'Calendar', 'Gallery', 'Info', 'Enquiry'];

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Anandam Residency home">
        <span className="brand-mark"><Flower2 size={22} /></span>
        <span>
          <strong>Anandam Residency</strong>
          <small>Hotel & Banquet</small>
        </span>
      </a>
      <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Primary navigation">
        {links.map((link) => (
          <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setOpen(false)}>
            {link}
          </a>
        ))}
        <a className="call-link" href="tel:+918787878787"><Phone size={16} /> {PHONE}</a>
      </nav>
      <button className="icon-button menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  );
}

function Hero({ onBookingMode }) {
  return (
    <section id="home" className="hero">
      <div className="hero-media" aria-hidden="true">
        <img src={photo3} alt="" />
      </div>
      <div className="hero-shell">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> Greater Noida West</span>
          <h1>Anandam Residency</h1>
          <p>
            A hotel and banquet address for family stays, wedding functions, business guests,
            terrace gatherings, and catered celebrations.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#booking" onClick={() => onBookingMode('rooms')}>
              Book Rooms <ChevronRight size={18} />
            </a>
            <a className="secondary-button" href="#booking" onClick={() => onBookingMode('banquet')}>
              Plan Function
            </a>
          </div>
        </div>
        <div className="quick-panel" aria-label="Property highlights">
          <div><BedDouble size={22} /><strong>{TOTAL_ROOMS}</strong><span>Rooms</span></div>
          <div><PartyPopper size={22} /><strong>Banquet</strong><span>Hall bookings</span></div>
          <div><Sun size={22} /><strong>Terrace</strong><span>Open-air events</span></div>
          <div><Utensils size={22} /><strong>Catering</strong><span>Food on request</span></div>
        </div>
      </div>
    </section>
  );
}

function BookingSection({ mode, setMode, refreshAvailability }) {
  const [roomForm, setRoomForm] = useState(roomInitial);
  const [banquetForm, setBanquetForm] = useState(banquetInitial);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  async function submitRoom(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api('/api/bookings/rooms', {
        method: 'POST',
        body: JSON.stringify(roomForm)
      });
      setStatus({ type: 'success', message: 'Room request saved. A confirmation email has been sent.' });
      setRoomForm(roomInitial);
      refreshAvailability();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function submitBanquet(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api('/api/bookings/banquet', {
        method: 'POST',
        body: JSON.stringify(banquetForm)
      });
      setStatus({ type: 'success', message: 'Banquet enquiry saved. A confirmation email has been sent.' });
      setBanquetForm(banquetInitial);
      refreshAvailability();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function updateRoom(key, value) {
    setRoomForm((current) => ({ ...current, [key]: value }));
  }

  function updateBanquet(key, value) {
    setBanquetForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSpace(space) {
    setBanquetForm((current) => {
      const exists = current.spaces.includes(space);
      return {
        ...current,
        spaces: exists ? current.spaces.filter((item) => item !== space) : [...current.spaces, space]
      };
    });
  }

  return (
    <section id="booking" className="booking-section">
      <div className="section-heading">
        <span className="eyebrow"><CalendarDays size={16} /> Booking desk</span>
        <h2>Reserve a stay or start planning your function</h2>
      </div>

      <div className="booking-grid">
        <div className="booking-card">
          <div className="segmented-control" role="tablist" aria-label="Booking type">
            <button type="button" className={mode === 'rooms' ? 'active' : ''} onClick={() => setMode('rooms')}>
              <BedDouble size={17} /> Rooms
            </button>
            <button type="button" className={mode === 'banquet' ? 'active' : ''} onClick={() => setMode('banquet')}>
              <PartyPopper size={17} /> Banquet
            </button>
          </div>

          {mode === 'rooms' ? (
            <form className="booking-form" onSubmit={submitRoom}>
              <Field label="Full name" value={roomForm.guest_name} onChange={(value) => updateRoom('guest_name', value)} required />
              <Field label="Email" type="email" value={roomForm.email} onChange={(value) => updateRoom('email', value)} required />
              <Field label="Phone" value={roomForm.phone} onChange={(value) => updateRoom('phone', value)} required />
              <div className="form-row">
                <Field label="Check-in" type="date" value={roomForm.check_in} onChange={(value) => updateRoom('check_in', value)} required />
                <Field label="Check-out" type="date" value={roomForm.check_out} onChange={(value) => updateRoom('check_out', value)} required />
              </div>
              <div className="form-row three">
                <Field label="Rooms" type="number" min="1" max="28" value={roomForm.rooms_requested} onChange={(value) => updateRoom('rooms_requested', value)} required />
                <Field label="Adults" type="number" min="1" value={roomForm.adults} onChange={(value) => updateRoom('adults', value)} required />
                <Field label="Children" type="number" min="0" value={roomForm.children} onChange={(value) => updateRoom('children', value)} />
              </div>
              <Field label="Notes" as="textarea" value={roomForm.notes} onChange={(value) => updateRoom('notes', value)} />
              <button className="primary-button full" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Request Room Booking'}
              </button>
            </form>
          ) : (
            <form className="booking-form" onSubmit={submitBanquet}>
              <Field label="Full name" value={banquetForm.guest_name} onChange={(value) => updateBanquet('guest_name', value)} required />
              <Field label="Email" type="email" value={banquetForm.email} onChange={(value) => updateBanquet('email', value)} required />
              <Field label="Phone" value={banquetForm.phone} onChange={(value) => updateBanquet('phone', value)} required />
              <div className="form-row">
                <Field label="Event date" type="date" value={banquetForm.event_date} onChange={(value) => updateBanquet('event_date', value)} required />
                <label className="field">
                  <span>Event type</span>
                  <select value={banquetForm.event_type} onChange={(event) => updateBanquet('event_type', event.target.value)}>
                    <option>Wedding</option>
                    <option>Ring Ceremony</option>
                    <option>Birthday</option>
                    <option>Corporate Event</option>
                    <option>Family Function</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>
              <Field label="Guest count" type="number" min="1" value={banquetForm.guest_count} onChange={(value) => updateBanquet('guest_count', value)} required />
              <div className="space-options" aria-label="Event spaces">
                {['Banquet Hall', 'Terrace', 'Rooms for Guests', 'Catering'].map((space) => (
                  <label key={space}>
                    <input type="checkbox" checked={banquetForm.spaces.includes(space)} onChange={() => toggleSpace(space)} />
                    <span>{space}</span>
                  </label>
                ))}
              </div>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={banquetForm.catering_required}
                  onChange={(event) => updateBanquet('catering_required', event.target.checked)}
                />
                Catering required
              </label>
              <Field label="Notes" as="textarea" value={banquetForm.notes} onChange={(value) => updateBanquet('notes', value)} />
              <button className="primary-button full" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Request Banquet Booking'}
              </button>
            </form>
          )}

          {status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}
        </div>

        <aside className="booking-aside">
          <div className="aside-photo">
            <img src={mode === 'rooms' ? photo2 : photo4} alt={mode === 'rooms' ? 'Guest room' : 'Banquet dining'} />
          </div>
          <div className="aside-content">
            <h3>{mode === 'rooms' ? 'Stay details' : 'Function details'}</h3>
            <ul>
              <li><BadgeCheck size={18} /> 28 total rooms with group booking support</li>
              <li><Clock size={18} /> Team confirms pricing and payment by call</li>
              <li><ChefHat size={18} /> Catering can be added for events and terraces</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, as, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {as === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="4" {...props} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
      )}
    </label>
  );
}

function AvailabilityCalendar({ availability, loading, error, reload }) {
  const days = availability?.days || [];
  const banquetByDate = useMemo(() => {
    const map = new Map();
    for (const event of availability?.banquetEvents || []) {
      const current = map.get(event.event_date) || [];
      current.push(event);
      map.set(event.event_date, current);
    }
    return map;
  }, [availability]);

  return (
    <section id="calendar" className="calendar-section">
      <div className="section-heading split">
        <div>
          <span className="eyebrow"><CalendarDays size={16} /> Availability</span>
          <h2>Room calendar for the next two weeks</h2>
        </div>
        <button className="secondary-button compact" type="button" onClick={reload}>Refresh</button>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
      {loading ? <p className="notice">Loading availability...</p> : null}

      <div className="calendar-grid" aria-label="Room availability calendar">
        {days.map((day) => {
          const fullness = day.booked / TOTAL_ROOMS;
          const level = fullness > 0.8 ? 'busy' : fullness > 0.45 ? 'medium' : 'open';
          const events = banquetByDate.get(day.date) || [];

          return (
            <article className={`calendar-day ${level}`} key={day.date}>
              <span>{formatDate(day.date)}</span>
              <strong>{day.available}</strong>
              <small>rooms left</small>
              <div className="room-meter" aria-hidden="true"><i style={{ width: `${Math.min(fullness * 100, 100)}%` }} /></div>
              {events.length ? <em>{events.length} banquet enquiry</em> : <em>Banquet open</em>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Highlights() {
  const items = [
    {
      icon: <Hotel size={23} />,
      title: 'Hotel stays',
      text: 'Ideal for wedding guests, family stays, business travellers, and group bookings with 28 rooms.'
    },
    {
      icon: <PartyPopper size={23} />,
      title: 'Banquet hall',
      text: 'Host ceremonies, birthdays, corporate gatherings, and family functions with decor and dining coordination.'
    },
    {
      icon: <Sun size={23} />,
      title: 'Terraces',
      text: 'Use the terrace for relaxed gatherings, evening dining, pre-wedding moments, and small celebrations.'
    },
    {
      icon: <ChefHat size={23} />,
      title: 'Catering',
      text: 'Food can be planned on catering basis, with menus confirmed directly by the property team.'
    }
  ];

  return (
    <section id="stay" className="content-section">
      <div className="section-heading">
        <span className="eyebrow"><Flower2 size={16} /> Hospitality</span>
        <h2>Built for stays, celebrations, and smooth hosting</h2>
      </div>
      <div className="feature-grid">
        {items.map((item) => (
          <article className="feature-card" key={item.title}>
            <div className="feature-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BanquetInfo() {
  return (
    <section id="banquet" className="banquet-band">
      <div className="banquet-copy">
        <span className="eyebrow"><PartyPopper size={16} /> Hotel & Banquet</span>
        <h2>Functions with room stays and terrace hospitality in one place</h2>
        <p>
          Anandam Residency can handle room stays for guests, banquet celebrations, terrace gatherings,
          and catering-led food service. The booking form captures your event date, expected guest count,
          selected spaces, and catering requirement so the team can respond with exact availability.
        </p>
        <a className="primary-button" href="#booking">Start Enquiry <ChevronRight size={18} /></a>
      </div>
      <div className="banquet-stack">
        <img src={photo6} alt="Event decor at Anandam Residency" />
        <img src={photo7} alt="Terrace area at Anandam Residency" />
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section id="gallery" className="gallery-section">
      <div className="section-heading">
        <span className="eyebrow"><Sparkles size={16} /> Gallery</span>
        <h2>Spaces and details</h2>
      </div>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <figure className={index === 0 ? 'wide' : ''} key={photo.src}>
            <img src={photo.src} alt={photo.label} />
            <figcaption>{photo.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function InfoAndMap() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api('/api/config').then(setConfig).catch(() => setConfig({ googleMapsApiKey: '', defaultLocation: null }));
  }, []);

  const location = config?.defaultLocation;
  const mapUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}&z=12&output=embed`
    : '';
  const directionsUrl = location
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
    : 'https://www.google.com/maps/search/?api=1&query=Anandam%20Residency%20Greater%20Noida';

  return (
    <section id="info" className="info-section">
      <div className="info-panel">
        <span className="eyebrow"><MapPin size={16} /> Visit</span>
        <h2>Anandam Residency</h2>
        <p>6, Kissan quota plot, Plot #235, Near Ek Murti Chowk, Sector 16B, Roza Yakubpur, Greater Noida, Uttar Pradesh 201009</p>
        <div className="contact-list">
          <a href="tel:+918787878787"><Phone size={18} /> {PHONE}</a>
          <a href={directionsUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> Directions</a>
          <a href="#enquiry"><Mail size={18} /> Send enquiry</a>
        </div>
        <p className="fine-print">
          For room blocks, banquet visits, terrace gatherings, and catering discussions, call before visiting
          so the team can keep the right person available.
        </p>
      </div>
      <div className="map-panel">
        {mapUrl ? (
          <iframe title="Anandam Residency map" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <div className="map-fallback">
            <MapPin size={32} />
            <span>Google Maps key or coordinates pending</span>
          </div>
        )}
      </div>
    </section>
  );
}

function EnquirySection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', enquiry_type: 'general', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setStatus({ type: 'success', message: 'Enquiry sent. The team will get back to you shortly.' });
      setForm({ name: '', email: '', phone: '', enquiry_type: 'general', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section id="enquiry" className="enquiry-section">
      <div className="section-heading">
        <span className="eyebrow"><Mail size={16} /> Enquiry</span>
        <h2>Ask about rooms, functions, catering, or terrace bookings</h2>
      </div>
      <form className="enquiry-form" onSubmit={submit}>
        <Field label="Name" value={form.name} onChange={(value) => update('name', value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} />
        <Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} required />
        <label className="field">
          <span>Enquiry type</span>
          <select value={form.enquiry_type} onChange={(event) => update('enquiry_type', event.target.value)}>
            <option value="general">General</option>
            <option value="rooms">Rooms</option>
            <option value="banquet">Banquet</option>
            <option value="catering">Catering</option>
            <option value="terrace">Terrace</option>
          </select>
        </label>
        <Field label="Message" as="textarea" value={form.message} onChange={(value) => update('message', value)} required />
        <button className="primary-button full" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Enquiry'}
        </button>
        {status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Anandam Residency</strong>
        <span>Hotel & Banquet</span>
      </div>
      <a href="tel:+918787878787"><Phone size={16} /> {PHONE}</a>
    </footer>
  );
}

function App() {
  const [bookingMode, setBookingMode] = useState('rooms');
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const loadAvailability = async () => {
    setAvailabilityLoading(true);
    setAvailabilityError('');

    try {
      const today = new Date().toISOString().slice(0, 10);
      const end = addDays(new Date(), 14);
      const data = await api(`/api/availability?start=${today}&end=${end}`);
      setAvailability(data);
    } catch (error) {
      setAvailabilityError(error.message);
      const today = new Date();
      setAvailability({
        days: Array.from({ length: 14 }, (_, index) => ({
          date: addDays(today, index),
          booked: 0,
          available: TOTAL_ROOMS
        })),
        banquetEvents: []
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero onBookingMode={setBookingMode} />
        <BookingSection mode={bookingMode} setMode={setBookingMode} refreshAvailability={loadAvailability} />
        <AvailabilityCalendar
          availability={availability}
          loading={availabilityLoading}
          error={availabilityError}
          reload={loadAvailability}
        />
        <Highlights />
        <BanquetInfo />
        <Gallery />
        <InfoAndMap />
        <EnquirySection />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
