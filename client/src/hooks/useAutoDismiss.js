import { useEffect } from 'react';

const useAutoDismiss = (value, setValue, dismissValue = '', delay = 5000) => {
  useEffect(() => {
    if (!value) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setValue(dismissValue);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, dismissValue, setValue, value]);
};

export default useAutoDismiss;
