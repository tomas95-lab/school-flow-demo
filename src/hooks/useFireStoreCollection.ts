import { useEffect, useState, useRef, useCallback } from "react";
import { collection, onSnapshot, getFirestore, query, orderBy, limit } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

// Cache global para evitar múltiples listeners
const cache = new Map<string, { data: any[], timestamp: number, listeners: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useFirestoreCollection<T extends DocumentData & { firestoreId?: string }>(
  path: string, 
  options?: { 
    limit?: number; 
    orderBy?: string; 
    enableCache?: boolean;
    dependencies?: any[];
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const cacheKey = `${path}_${options?.limit || 'all'}_${options?.orderBy || 'none'}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar cache si está habilitado
      if (options?.enableCache !== false && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      // Crear query con opciones
      let q: any = collection(db, path);
      if (options?.orderBy) {
        q = query(q, orderBy(options.orderBy));
      }
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

              const unsubscribe = onSnapshot(
          q, 
          (snapshot: any) => {
            const docs = snapshot.docs.map((doc: any) => ({
              ...(doc.data() as T),
              firestoreId: doc.id,
            }));
            
            setData(docs);
            setLoading(false);

            // Actualizar cache
            if (options?.enableCache !== false) {
              cache.set(cacheKey, {
                data: docs,
                timestamp: Date.now(),
                listeners: (cache.get(cacheKey)?.listeners || 0) + 1
              });
            }
          },
          (error: any) => {
            console.error(`Error loading collection ${path}:`, error);
            setError(error.message);
            setLoading(false);
          }
        );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error(`Error setting up collection listener for ${path}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [path, options?.limit, options?.orderBy, options?.enableCache, ...(options?.dependencies || [])]);

  useEffect(() => {
    fetchData();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Reducir contador de listeners en cache
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        cached.listeners--;
        if (cached.listeners <= 0) {
          cache.delete(cacheKey);
        }
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook para datos que no necesitan actualizaciones en tiempo real
export function useFirestoreCollectionOnce<T extends DocumentData & { firestoreId?: string }>(
  path: string,
  options?: { limit?: number; orderBy?: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { getDocs } = await import('firebase/firestore');
        let q: any = collection(db, path);
        
        if (options?.orderBy) {
          q = query(q, orderBy(options.orderBy));
        }
        if (options?.limit) {
          q = query(q, limit(options.limit));
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          firestoreId: doc.id,
        }));
        
        setData(docs);
        setLoading(false);
      } catch (err) {
        console.error(`Error loading collection ${path}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, [path, options?.limit, options?.orderBy]);

  return { data, loading, error };
}
