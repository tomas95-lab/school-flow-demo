import { useEffect, useState, useRef, useCallback } from "react";
import { collection, onSnapshot, getFirestore, query, orderBy, limit, type QueryConstraint } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { useGlobalError } from "@/components/GlobalErrorProvider";
import { useAuth } from "@/context/AuthContext";
import { isDemoMode, getDemoData } from "@/data/demoData";

// Cache global para evitar múltiples listeners
const cache = new Map<string, { data: DocumentData[]; timestamp: number; listeners: number }>();
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

function cleanOldCacheEntries() {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, cache.size - MAX_CACHE_ENTRIES);
    toDelete.forEach(([key]) => cache.delete(key));
  }
}

export function useFirestoreCollection<T extends DocumentData & { firestoreId?: string }>(
  path: string, 
  options?: { 
    limit?: number; 
    orderBy?: string; 
    enableCache?: boolean;
    dependencies?: unknown[];
    constraints?: QueryConstraint[];
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const depsKey = options?.dependencies ? JSON.stringify(options.dependencies) : 'nodeps';
  const constraintsKey = options?.constraints ? `c${options.constraints.length}` : 'c0';
  const cacheKey = `${path}_${options?.limit || 'all'}_${options?.orderBy || 'none'}_${constraintsKey}_${depsKey}`;
  const { handleError } = useGlobalError();
  const { user, loading: authLoading } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Wait for authentication to complete
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setError('Usuario no autenticado. Por favor, inicia sesión.');
      setLoading(false);
      return;
    }

    try {
      // Si estamos en modo demo, usar datos demo
      if (isDemoMode()) {
        const demoData = await getDemoData<T>(path as any);
        setData(demoData);
        setLoading(false);
        return;
      }

      // Verificar cache si está habilitado y usar datos iniciales para evitar flashes
      if (options?.enableCache !== false && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION && (cached.data?.length ?? 0) > 0) {
          setData(cached.data as T[]);
          // No retornamos aún: continuamos para revalidar en segundo plano
        }
      }

      // Crear query con opciones
      let qRef = collection(db, path);
      let q = qRef as any;
      if (options?.orderBy) {
        q = query(qRef, orderBy(options.orderBy));
      }
      if (options?.limit) {
        q = query(qRef, limit(options.limit));
      }
      if (options?.constraints && options.constraints.length > 0) {
        q = query(qRef, ...options.constraints);
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

          if (options?.enableCache !== false) {
            const existing = cache.get(cacheKey);
            cache.set(cacheKey, {
              data: docs,
              timestamp: Date.now(),
              listeners: existing ? existing.listeners : 1,
            });
            cleanOldCacheEntries();
          }
        },
        (error: any) => {
          console.error(`Error loading collection ${path}:`, error);
          
          // Handle specific permission errors
          if (error.code === 'permission-denied') {
            const errorMessage = `No tienes permisos para acceder a ${path}. Verifica que estés autenticado y tengas los permisos necesarios.`;
            handleError(error, `Loading collection: ${path}`);
            setError(errorMessage);
          } else {
            handleError(error, `Loading collection: ${path}`);
            setError(error instanceof Error ? error.message : 'Unknown error');
          }
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;

      // Incrementar contador de listeners solo al suscribirse
      if (options?.enableCache !== false) {
        const cached = cache.get(cacheKey);
        cache.set(cacheKey, {
          data: cached?.data || [],
          timestamp: cached?.timestamp || Date.now(),
          listeners: (cached?.listeners ?? 0) + 1,
        });
      }
    } catch (err) {
      console.error(`Error setting up collection listener for ${path}:`, err);
      handleError(err, `Setting up listener for: ${path}`);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [path, options?.limit, options?.orderBy, options?.enableCache, cacheKey, db, handleError, user, authLoading, ...(options?.dependencies || [])]);

  useEffect(() => {
    // Don't fetch data while authentication is loading
    if (authLoading) {
      return;
    }

    fetchData();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Reducir contador de listeners en cache
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        cached.listeners = Math.max(0, (cached.listeners || 1) - 1);
        if (cached.listeners <= 0) {
          cache.delete(cacheKey);
        }
      }
    };
  }, [fetchData, cacheKey, authLoading]);

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
        const colRef = collection(db, path);
        let qRef = colRef as any;
        if (options?.orderBy) {
          qRef = query(colRef, orderBy(options.orderBy));
        }
        if (options?.limit) {
          qRef = query(colRef, limit(options.limit));
        }

        const snapshot = await getDocs(qRef);
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
  }, [path, options?.limit, options?.orderBy, db]);

  return { data, loading, error };
} 
