import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getDateInputValue,
  getLocalDateFromValue,
  getTodayValue,
  isClosedDate,
} from '../../utils/bookingAvailability';
import './BookingDatePicker.css';

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const toMondayFirstIndex = (date) => {
  return (date.getDay() + 6) % 7;
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - toMondayFirstIndex(firstDay));

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);

    return day;
  });
};

const formatDisplayDate = (dateValue) => {
  const date = getLocalDateFromValue(dateValue);

  if (!date) {
    return 'Seleziona data';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const BookingDatePicker = ({ id, label, value, onChange }) => {
  const pickerRef = useRef(null);
  const selectedDate = getLocalDateFromValue(value) || new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const todayValue = getTodayValue();
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const visibleMonthLabel = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  useEffect(() => {
    const date = getLocalDateFromValue(value);

    if (date) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnOutsideClick = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  const changeMonth = (direction) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(currentMonth.getMonth() + direction);

      return nextMonth;
    });
  };

  const selectDate = (dateValue) => {
    onChange(dateValue);
    setIsOpen(false);
  };

  return (
    <div className="booking-date-picker" ref={pickerRef}>
      <label className="booking-date-picker-label" htmlFor={id}>
        {label}
      </label>
      <button
        className="booking-date-picker-trigger"
        id={id}
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarDays size={18} strokeWidth={2.2} aria-hidden="true" />
        <span>{formatDisplayDate(value)}</span>
      </button>

      {isOpen && (
        <div className="booking-date-picker-popover" role="dialog" aria-label="Calendario">
          <div className="booking-date-picker-month">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Mese precedente">
              <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <strong>{visibleMonthLabel}</strong>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Mese successivo">
              <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="booking-date-picker-weekdays" aria-hidden="true">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="booking-date-picker-grid">
            {calendarDays.map((day) => {
              const dateValue = getDateInputValue(day);
              const isOutsideMonth = day.getMonth() !== visibleMonth.getMonth();
              const isDisabled = dateValue < todayValue || isClosedDate(dateValue);
              const isSelected = dateValue === value;

              return (
                <button
                  className={`booking-date-picker-day${isOutsideMonth ? ' outside' : ''}${
                    isSelected ? ' selected' : ''
                  }`}
                  disabled={isDisabled}
                  key={dateValue}
                  type="button"
                  onClick={() => selectDate(dateValue)}
                  title={isClosedDate(dateValue) ? 'Chiuso il lunedi' : undefined}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDatePicker;
