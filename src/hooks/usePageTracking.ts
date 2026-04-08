import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_MEASUREMENT_ID } from '../utils/analytics';

export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    });
  }, [location.pathname, location.search]);
}
