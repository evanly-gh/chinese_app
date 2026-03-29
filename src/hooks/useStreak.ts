import { useState, useEffect } from 'react';
import { getStreak } from '../storage/reviewHistoryStorage';

export function useStreak(): { streak: number; loading: boolean } {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStreak().then(data => {
      setStreak(data.current);
      setLoading(false);
    });
  }, []);

  return { streak, loading };
}
