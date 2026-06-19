import bookingOptions from '../data/bookingOptions.json';

const { availableTimes } = bookingOptions;
const mondayIndex = 1;

export const getDateInputValue = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  if (typeof dateValue === 'string') {
    if (!dateValue.includes('T')) {
      return dateValue;
    }

    const date = new Date(dateValue);
    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
  }

  const timezoneOffset = dateValue.getTimezoneOffset() * 60000;
  return new Date(dateValue.getTime() - timezoneOffset).toISOString().split('T')[0];
};

export const getTodayValue = () => getDateInputValue(new Date());

export const getLocalDateFromValue = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  return new Date(`${dateValue}T00:00:00`);
};

export const isClosedDate = (dateValue) => {
  const date = getLocalDateFromValue(dateValue);

  return Boolean(date) && date.getDay() === mondayIndex;
};

export const getNextOpenDateValue = (fromDate = new Date()) => {
  const nextDate = new Date(fromDate);

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const candidate = new Date(nextDate);
    candidate.setDate(nextDate.getDate() + dayOffset);

    const candidateValue = getDateInputValue(candidate);
    const hasFutureTime = availableTimes.some((time) =>
      new Date(`${candidateValue}T${time}`) > fromDate
    );

    if (!isClosedDate(candidateValue) && hasFutureTime) {
      return candidateValue;
    }
  }

  return getTodayValue();
};

export const isFutureBookingTime = (dateValue, timeValue, now = new Date()) => {
  if (!dateValue || !timeValue) {
    return false;
  }

  return new Date(`${dateValue}T${timeValue}`) > now;
};

export const getBookingTimeOptions = (dateValue, now = new Date()) => {
  const closedDate = isClosedDate(dateValue);

  return availableTimes.map((time) => {
    const isPast = !isFutureBookingTime(dateValue, time, now);

    return {
      time,
      disabled: closedDate || isPast,
      reason: closedDate ? 'Chiuso il lunedi' : 'Orario passato',
    };
  });
};

export const getFirstAvailableTime = (dateValue, now = new Date()) => {
  return getBookingTimeOptions(dateValue, now).find((option) => !option.disabled)?.time || '';
};

export const getSafeBookingDate = (dateValue) => {
  const todayValue = getTodayValue();

  if (
    !dateValue ||
    dateValue < todayValue ||
    isClosedDate(dateValue) ||
    !getFirstAvailableTime(dateValue)
  ) {
    return getNextOpenDateValue();
  }

  return dateValue;
};
