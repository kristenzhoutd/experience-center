import { useEffect, useState } from 'react';
import { loadHiddenForm } from '../utils/marketo';

export function useMarketoForm() {
  const [marketoForm, setMarketoForm] = useState<MktoForm | null>(null);

  useEffect(() => {
    loadHiddenForm()
      .then(setMarketoForm)
      .catch((err) => console.warn('[Marketo] Failed to load form:', err));
  }, []);

  return { marketoForm, isReady: marketoForm !== null };
}
