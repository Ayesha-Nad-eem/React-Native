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
      // Safely format values for logging so nulls are visible and objects are stringified
      function formatForLog(v: any) {
        try {
          if (v === null) return '<null>';
          if (typeof v === 'string') return v;
          return JSON.stringify(v, (_k, val) => (val === null ? '<null>' : val), 2);
        } catch (e) {
          try { return String(v); } catch (e2) { return '<unserializable>'; }
        }
      }

      try {
        const extras = (Constants?.expoConfig?.extra as any) || (Constants?.manifest?.extra as any) || {};
        const key = extras.TOLLGURU_KEY || '';
        const enabled = typeof extras.TOLLGURU_ENABLED === 'boolean' ? extras.TOLLGURU_ENABLED : true;
        if (!enabled) return { amount: 0, raw: 'tollguru disabled by config' };
        if (!key) return { amount: 0, raw: 'missing TOLLGURU_KEY' };
        if (tollGuruDisabledForSessionRef.current) return { amount: 0, raw: 'TollGuru disabled for this session due to previous quota errors' };
        if (!pick || !drop) return { amount: 0, raw: 'missing coordinates' };

          // Use the TollGuru public API endpoint (v2 origin-destination route)
          // The project previously used a hardcoded v1 endpoint and fixed coords.
          const endpoint = 'https://api.tollguru.com/toll/v2/origin-destination-waypoints';
          const payload: any = {
            from: pick ? { lat: pick.latitude, lng: pick.longitude } : { lat: 40.0, lng: -74.0 },
            to: drop ? { lat: drop.latitude, lng: drop.longitude } : { lat: 41.0, lng: -73.5 },
            vehicle: {
              type: '2AxlesAuto'
            }
          };
        if (encoded) payload.encoded_polyline = encoded;

        const maskedKey = key ? `${String(key).slice(0, 4)}...${String(key).slice(-4)}` : '<missing>';
        console.info('[TollGuru] Request', { time: new Date().toISOString(), endpoint, maskedKey, payload });
  // Quick dev-only check: log runtime key length (do NOT enable in production builds)
  console.log('[TollGuru] Using API key:', maskedKey);
        console.log("key ",key);
        console.log(payload);
  try { console.debug('[TollGuru] runtime key length (dev only)', key ? String(key).length : 0); } catch (e) {}

        const t0 = Date.now();

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-key': key },
          body: JSON.stringify(payload)
        });

        const t1 = Date.now();
        const durationMs = t1 - t0;
        const text = await res.text().catch(() => '<<unreadable response>>');
        let respHeaders: any = undefined;
        try {
          // Try to serialize headers if available
          if (res && (res as any).headers) {
            const h = (res as any).headers;
            if (typeof h.forEach === 'function') {
              respHeaders = {};
              h.forEach((v: any, k: any) => { respHeaders[k] = v; });
            } else if (typeof h.entries === 'function') {
              respHeaders = Object.fromEntries(h.entries());
            } else {
              respHeaders = h;
            }
          }
        } catch (e) { respHeaders = '<unreadable headers>'; }

        console.info('[TollGuru] Response', { time: new Date().toISOString(), durationMs, status: res.status, statusText: (res as any).statusText, headers: respHeaders, body: text });
        let j: any = null;
        try { j = JSON.parse(text); } catch (e) { j = null; }
        const rawStr = `HTTP ${res.status} - ${formatForLog(j ?? text)}`;

        // Handle common non-OK cases with helpful fallbacks and messages
        if (!res.ok) {
          // Quota exhausted: turn off further TollGuru calls for this session and return a clear message
          if (res.status === 403) {
            tollGuruDisabledForSessionRef.current = true;
            const now = Date.now();
            const warnKey = `403|quota|${respHeaders && (respHeaders['x-amzn-requestid'] || respHeaders['x-amzn-requestid'.toLowerCase()]) || '<no-id>'}`;
            if (warnKey !== lastTollGuruWarnKeyRef.current || now - lastTollGuruWarnAtRef.current > 60_000) {
              console.warn('TollGuru quota exceeded', rawStr, { respHeaders });
              lastTollGuruWarnKeyRef.current = warnKey;
              lastTollGuruWarnAtRef.current = now;
            }
            return { amount: 0, raw: { message: 'Toll estimates temporarily unavailable — API quota exceeded. Add billing or wait for reset.', status: 403, details: j || text } };
          }

          // Routing backend error: try a safe fallback (retry without encoded_polyline) once
          if (res.status === 500 && j && (j.code === 'ROUTING_ERROR' || j.status === 500)) {
            try {
              const fallbackPayload = { from: payload.from, to: payload.to, vehicle: payload.vehicle };
              console.info('[TollGuru] Routing error detected — retrying without encoded_polyline', { fallbackPayload });
              const fallRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-key': key },
                body: JSON.stringify(fallbackPayload)
              });
              const fallText = await fallRes.text().catch(() => '<<unreadable response>>');
              let fallJson: any = null;
              try { fallJson = JSON.parse(fallText); } catch (e) { fallJson = null; }
              let fallHeaders: any = undefined;
              try {
                const h = (fallRes as any).headers;
                if (typeof h.forEach === 'function') { fallHeaders = {}; h.forEach((v: any, k: any) => { fallHeaders[k] = v; }); }
                else if (typeof h.entries === 'function') fallHeaders = Object.fromEntries(h.entries());
                else fallHeaders = h;
              } catch (e) { fallHeaders = '<unreadable headers>'; }
              console.info('[TollGuru] Fallback response', { status: fallRes.status, headers: fallHeaders, body: fallText });

              // Try to extract tolls from fallback JSON using same heuristics
              if (fallRes.ok) {
                const fj = fallJson;
                if (fj != null) {
                  if (typeof fj.total_cost === 'number' && fj.total_cost > 0) return { amount: fj.total_cost, raw: fj };
                  if (typeof fj.total_toll === 'number' && fj.total_toll > 0) return { amount: fj.total_toll, raw: fj };
                  if (fj && fj.route && typeof fj.route.toll_cost === 'number' && fj.route.toll_cost > 0) return { amount: fj.route.toll_cost, raw: fj };
                  if (Array.isArray(fj.tolls) && fj.tolls.length > 0) {
                    const sum = fj.tolls.reduce((s: number, t: any) => s + (Number(t.amount || t.price || 0) || 0), 0);
                    if (sum > 0) return { amount: sum, raw: fj };
                  }
                }
              }
              // If fallback gave nothing useful, fall through to original error handling
            } catch (e) {
              console.warn('TollGuru fallback attempt failed', e);
            }
          }

          // Check for AWS gateway error headers to capture useful trace ids
          const errType = (respHeaders && (respHeaders['x-amzn-errortype'] || respHeaders['x-amzn-errortype'.toLowerCase()])) || undefined;
          const reqId = (respHeaders && (respHeaders['x-amzn-requestid'] || respHeaders['x-amzn-requestid'.toLowerCase()])) || (respHeaders && (respHeaders['x-amz-request-id'] || respHeaders['x-amz-request-id'.toLowerCase()]));
          const warnKey = `${res.status}|${errType || '<no-err>'}|${reqId || '<no-id>'}`;
          const now = Date.now();
          if (warnKey !== lastTollGuruWarnKeyRef.current || now - lastTollGuruWarnAtRef.current > 60_000) {
            console.warn('TollGuru request failed', res.status, rawStr, { errType, reqId });
            lastTollGuruWarnKeyRef.current = warnKey;
            lastTollGuruWarnAtRef.current = now;
          } else {
            // minor log at info level to keep a trace without spamming WARN
            console.info('TollGuru repeated failure suppressed', { status: res.status, reqId });
          }
          return { amount: 0, raw: rawStr };
        }

        if (j == null) {
          const now = Date.now();
          const warnKey = `unreadable|${res.status}|${respHeaders && (respHeaders['x-amzn-requestid'] || respHeaders['x-amzn-requestid'.toLowerCase()]) || '<no-id>'}`;
          if (warnKey !== lastTollGuruWarnKeyRef.current || now - lastTollGuruWarnAtRef.current > 60_000) {
            console.warn('TollGuru response unreadable JSON', rawStr);
            lastTollGuruWarnKeyRef.current = warnKey;
            lastTollGuruWarnAtRef.current = now;
          } else {
            console.info('TollGuru unreadable JSON suppressed');
          }
          return { amount: 0, raw: rawStr };
        }

        if (typeof j.total_cost === 'number' && j.total_cost > 0) return { amount: j.total_cost, raw: j };
        if (typeof j.total_toll === 'number' && j.total_toll > 0) return { amount: j.total_toll, raw: j };
        if (j && j.route && typeof j.route.toll_cost === 'number' && j.route.toll_cost > 0) return { amount: j.route.toll_cost, raw: j };
        if (Array.isArray(j.tolls) && j.tolls.length > 0) {
          const sum = j.tolls.reduce((s: number, t: any) => s + (Number(t.amount || t.price || 0) || 0), 0);
          if (sum > 0) return { amount: sum, raw: j };
        }
        for (const k of Object.keys(j)) {
          const v = j[k];
          if ((/toll|cost|amount|price/i).test(k) && typeof v === 'number' && v > 0) return { amount: v, raw: j };
        }

        console.warn('TollGuru response did not include toll. Response:', rawStr, 'Payload:', payload);
        return { amount: 0, raw: rawStr };
      } catch (e) {
        console.warn('Toll estimate failed', e);
        return { amount: 0, raw: e };
      }
    }

    const tollResult = await fetchTollCost(pickup, dropoff, encodedPolyline);
    const tollAmount = Number((tollResult && (tollResult.amount || 0)) || 0);
    const tollRaw = tollResult && tollResult.raw ? tollResult.raw : undefined;

    return cars.map((car) => {
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
