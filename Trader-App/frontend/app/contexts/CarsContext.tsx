import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Car = {
  id: string;
  modelName: string;
  capacity: number;
  luggageSpace: number;
  perHourRate: number;
  modelYear: number;
  // optional per-km rate; if not provided a sensible default will be used
  perKmRate?: number;
  imageUri?: string;
};

type CarsContextType = {
  cars: Car[];
  addCar: (c: Omit<Car, 'id'>) => Promise<void>;
  updateCar: (id: string, patch: Partial<Omit<Car, 'id'>>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  // Calculate fares for all cars given a route/duration and requested hours
  // If pickup/dropoff coordinates are provided, this will include estimated tolls (async)
  calculateFares: (opts: { distanceKm: number; durationMin: number; hours: number; pickup?: { latitude: number; longitude: number }; dropoff?: { latitude: number; longitude: number }; encodedPolyline?: string }) => Promise<Array<{
    car: Car;
    fare: number;
    breakdown: { hourFare: number; distanceFare: number; tollFare: number };
  }>>;
};

const CarsContext = createContext<CarsContextType | undefined>(undefined);
const STORAGE_KEY = 'cars_storage_v1';

function generateId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function CarsProvider({ children }: { children: React.ReactNode }) {
  const [cars, setCars] = useState<Car[]>([]);

  // Simple in-memory debounce to avoid spamming the console with identical TollGuru errors
  // Use refs so the state persists across renders and multiple calls
  const lastTollGuruWarnKeyRef = React.useRef<string>('');
  const lastTollGuruWarnAtRef = React.useRef<number>(0);
  // Disable TollGuru calls for this app session after hitting quota (403)
  const tollGuruDisabledForSessionRef = React.useRef<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCars(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load cars', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
      } catch (e) {
        console.warn('Failed to save cars', e);
      }
    })();
  }, [cars]);

  const addCar = async (c: Omit<Car, 'id'>) => {
    const newCar: Car = { id: generateId(), ...c };
    setCars((s) => [newCar, ...s]);
  };

  const updateCar = async (id: string, patch: Partial<Omit<Car, 'id'>>) => {
    setCars((s) => s.map((car) => (car.id === id ? { ...car, ...patch } : car)));
  };

  const deleteCar = async (id: string) => {
    setCars((s) => s.filter((c) => c.id !== id));
  };

  const refresh = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setCars(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to refresh cars', e);
    }
  };

  async function calculateFares({ distanceKm, durationMin, hours, pickup, dropoff, encodedPolyline }: { distanceKm: number; durationMin: number; hours: number; pickup?: { latitude: number; longitude: number }; dropoff?: { latitude: number; longitude: number }; encodedPolyline?: string }) {

    async function fetchTollCost(pick?: { latitude: number; longitude: number }, drop?: { latitude: number; longitude: number }, encoded?: string): Promise<{ amount: number; raw?: any }> {
      try {
        // Get API key from expo config
        const extras = (Constants?.expoConfig?.extra as any) || (Constants?.manifest?.extra as any) || {};
        const apiKey = extras.TOLLGURU_KEY || '';
        const enabled = typeof extras.TOLLGURU_ENABLED === 'boolean' ? extras.TOLLGURU_ENABLED : true;
        
        // Early exit conditions
        if (!enabled) {
          console.log('[TollGuru] Disabled by config');
          return { amount: 0, raw: 'tollguru disabled by config' };
        }
        
        if (!apiKey || apiKey.trim() === '') {
          console.warn('[TollGuru] Missing API key');
          return { amount: 0, raw: 'missing TOLLGURU_KEY' };
        }
        
        if (tollGuruDisabledForSessionRef.current) {
          console.log('[TollGuru] Disabled for session due to previous errors');
          return { amount: 0, raw: 'TollGuru disabled for this session due to previous quota errors' };
        }
        
        if (!pick || !drop) {
          console.log('[TollGuru] Missing coordinates');
          return { amount: 0, raw: 'missing coordinates' };
        }

        // Prepare TollGuru API request
        const endpoint = 'https://api.tollguru.com/toll/v2/origin-destination-waypoints';
        const payload: any = {
          from: {
            lat: pick.latitude,
            lng: pick.longitude
          },
          to: {
            lat: drop.latitude,
            lng: drop.longitude
          },
          vehicleType: '2AxlesAuto'
        };

        const maskedKey = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
        console.log('[TollGuru] Making request', {
          endpoint,
          maskedKey,
          from: payload.from,
          to: payload.to,
          hasEncodedPolyline: !!encoded
        });

        const t0 = Date.now();

        // Make the API request with proper headers
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'x-api-key': apiKey.trim()
          },
          body: JSON.stringify(payload)
        });

        const t1 = Date.now();
        const durationMs = t1 - t0;
        
        // Parse response
        const text = await res.text().catch(() => '<<unreadable response>>');
        let jsonData: any = null;
        try { 
          jsonData = JSON.parse(text); 
        } catch (e) { 
          console.warn('[TollGuru] Failed to parse JSON response', text);
        }

        console.log('[TollGuru] Response received', {
          status: res.status,
          durationMs,
          hasJsonData: !!jsonData
        });

        // Handle non-OK responses
        if (!res.ok) {
          // Handle 403 - Quota exceeded
          if (res.status === 403) {
            tollGuruDisabledForSessionRef.current = true;
            const now = Date.now();
            if (now - lastTollGuruWarnAtRef.current > 60_000) {
              console.warn('[TollGuru] Quota exceeded (403). Disabling for session.');
              lastTollGuruWarnAtRef.current = now;
            }
            return { 
              amount: 0, 
              raw: { 
                message: 'Toll estimates temporarily unavailable — API quota exceeded.', 
                status: 403 
              } 
            };
          }

          // Handle 401 - Authorization error
          if (res.status === 401) {
            console.error('[TollGuru] Authorization failed (401). Check your API key.');
            return { 
              amount: 0, 
              raw: { 
                message: 'Invalid API key. Please check your TOLLGURU_KEY.', 
                status: 401 
              } 
            };
          }

          // Handle 500 - Server error
          if (res.status === 500) {
            console.warn('[TollGuru] Server error (500)');
            return { 
              amount: 0, 
              raw: { 
                message: 'TollGuru service error.', 
                status: 500,
                data: jsonData 
              } 
            };
          }

          // Other errors
          console.warn('[TollGuru] Request failed', { status: res.status, data: jsonData || text });
          return { amount: 0, raw: { status: res.status, data: jsonData || text } };
        }

        // Handle successful response but no JSON
        if (!jsonData) {
          console.warn('[TollGuru] Success but unreadable JSON', text);
          return { amount: 0, raw: 'unreadable JSON response' };
        }

        // Extract toll amount from various possible response structures
        console.log('[TollGuru] Parsing toll data', jsonData);

        // Try different possible toll amount fields
        if (typeof jsonData.total_cost === 'number' && jsonData.total_cost > 0) {
          console.log('[TollGuru] Found toll in total_cost:', jsonData.total_cost);
          return { amount: jsonData.total_cost, raw: jsonData };
        }
        
        if (typeof jsonData.total_toll === 'number' && jsonData.total_toll > 0) {
          console.log('[TollGuru] Found toll in total_toll:', jsonData.total_toll);
          return { amount: jsonData.total_toll, raw: jsonData };
        }

        if (typeof jsonData.toll === 'number' && jsonData.toll > 0) {
          console.log('[TollGuru] Found toll in toll:', jsonData.toll);
          return { amount: jsonData.toll, raw: jsonData };
        }
        
        if (jsonData.route && typeof jsonData.route.toll_cost === 'number' && jsonData.route.toll_cost > 0) {
          console.log('[TollGuru] Found toll in route.toll_cost:', jsonData.route.toll_cost);
          return { amount: jsonData.route.toll_cost, raw: jsonData };
        }
        
        // Check for tolls array
        if (Array.isArray(jsonData.tolls) && jsonData.tolls.length > 0) {
          const sum = jsonData.tolls.reduce((s: number, t: any) => {
            const amount = Number(t.amount || t.price || t.cost || 0) || 0;
            return s + amount;
          }, 0);
          if (sum > 0) {
            console.log('[TollGuru] Found toll sum from tolls array:', sum);
            return { amount: sum, raw: jsonData };
          }
        }

        // Search all keys for potential toll fields
        for (const key of Object.keys(jsonData)) {
          const value = jsonData[key];
          if ((/toll|cost|amount|price/i).test(key) && typeof value === 'number' && value > 0) {
            console.log(`[TollGuru] Found toll in ${key}:`, value);
            return { amount: value, raw: jsonData };
          }
        }

        // No toll found
        console.log('[TollGuru] No toll charges found in response');
        return { amount: 0, raw: jsonData };
        
      } catch (err: any) {
        console.error('[TollGuru] Exception:', err);
        return { amount: 0, raw: { error: err?.message || 'Unknown error' } };
      }
    }

    // Fetch toll cost
    const tollResult = await fetchTollCost(pickup, dropoff, encodedPolyline);
    const tollAmount = Number((tollResult && (tollResult.amount || 0)) || 0);
    const tollRaw = tollResult && tollResult.raw ? tollResult.raw : undefined;

    console.log('[Fare Calculation] Toll result:', { tollAmount, hasRaw: !!tollRaw });

    return cars.map((car: Car) => {
      const perKm = typeof car.perKmRate === 'number' ? car.perKmRate : 1.0;
      const hourFare = car.perHourRate * Math.max(0, hours);
      const distanceFare = perKm * Math.max(0, distanceKm);
      const tollFare = Number(tollAmount || 0);
      const fare = Number((hourFare + distanceFare + tollFare).toFixed(2));
      return { car, fare, breakdown: { hourFare: Number(hourFare.toFixed(2)), distanceFare: Number(distanceFare.toFixed(2)), tollFare: Number(tollFare.toFixed(2)), rawTollResponse: tollRaw } };
    });
  }

  return (
    <CarsContext.Provider value={{ cars, addCar, updateCar, deleteCar, refresh, calculateFares }}>
      {children}
    </CarsContext.Provider>
  );
}

export function useCars() {
  const ctx = useContext(CarsContext);
  if (!ctx) throw new Error('useCars must be used inside CarsProvider');
  return ctx;
}
