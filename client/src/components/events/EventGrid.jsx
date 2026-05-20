import { useState } from 'react';
import events from '../../data/eventOptions.json';
import './EventGrid.css';

const EventGrid = ({ onBookEvent }) => {
  const [bookingQuantities, setBookingQuantities] = useState(
    events.reduce((quantities, event) => {
      return {
        ...quantities,
        [event.id]: 1,
      };
    }, {})
  );
  const [bookedEvents, setBookedEvents] = useState({});

  const updateQuantity = (eventId, nextQuantity, maxQuantity) => {
    const safeQuantity = Math.min(maxQuantity, Math.max(1, Number(nextQuantity) || 1));

    setBookingQuantities((currentQuantities) => ({
      ...currentQuantities,
      [eventId]: safeQuantity,
    }));
    setBookedEvents((currentBookedEvents) => ({
      ...currentBookedEvents,
      [eventId]: false,
    }));
  };

  const bookEvent = (event) => {
    const eventId = event.id;

    setBookedEvents((currentBookedEvents) => ({
      ...currentBookedEvents,
      [eventId]: true,
    }));

    if (onBookEvent) {
      onBookEvent({
        id: event.id,
        title: event.title,
        date: event.date,
        guests: bookingQuantities[event.id],
        seatsRemaining: event.seatsRemaining,
      });
    }
  };

  return (
    <section className="events-section" aria-labelledby="events-title">
      <div className="events-header">
        <span className="events-kicker">CALENDARIO</span>
        <h1 id="events-title">Eventi & Esperienze</h1>
        <p className="events-subtitle">
          Cene a tema, corsi di cucina, degustazioni e serate musicali per vivere il ristorante
          in modo nuovo.
        </p>
      </div>

      <div className="events-grid">
        {events.map((event) => (
          <article key={event.id} className="event-card">
            <div className="event-card-top">
              <span className="event-icon" aria-hidden="true">
                {event.icon}
              </span>
              <span className="event-category">{event.category}</span>
            </div>

            <div className="event-card-body">
              <h2>{event.title}</h2>
              <p className="event-description">{event.description}</p>
              <div className="event-date">
                <span aria-hidden="true">📅</span>
                {event.date}
              </div>
            </div>

            <div className="event-card-footer">
              <span className="event-price">{event.price}</span>
              <div className="event-booking">
                <span className="event-seats">{event.seatsRemaining} posti rimanenti</span>
                <div className="event-booking-controls">
                  <label className="event-booking-label" htmlFor={`event-guests-${event.id}`}>
                    Persone
                  </label>
                  <input
                    id={`event-guests-${event.id}`}
                    className="event-guests-input"
                    type="number"
                    min="1"
                    max={event.seatsRemaining}
                    value={bookingQuantities[event.id]}
                    onChange={(inputEvent) =>
                      updateQuantity(event.id, inputEvent.target.value, event.seatsRemaining)
                    }
                  />
                  <button
                    className="event-booking-button"
                    type="button"
                    onClick={() => bookEvent(event)}
                  >
                    Prenota
                  </button>
                </div>
                {bookedEvents[event.id] && (
                  <p className="event-booking-status" role="status">
                    Richiesta per {bookingQuantities[event.id]} persone registrata.
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default EventGrid;
