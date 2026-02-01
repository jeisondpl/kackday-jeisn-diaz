import { useEffect } from 'react';
import { useInteligenciaStore } from '../../application/store/inteligenciaStore.ts';

export function useInteligencia() {
  const store = useInteligenciaStore();

  useEffect(() => {
    if (store.summaryStatus === 'idle') {
      store.fetchAll();
    }
    if (store.docsStatus === 'idle') {
      store.listDocs();
    }
  }, [store]);

  return store;
}
