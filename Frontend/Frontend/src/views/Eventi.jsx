import EventGrid from '../components/events/EventGrid';

const Eventi = ({ onBookEvent }) => {
  return (
    <div className="eventi-page">
      <EventGrid onBookEvent={onBookEvent} />
    </div>
  );
};

export default Eventi;
