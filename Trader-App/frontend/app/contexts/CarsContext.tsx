import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

import axios from "axios";

interface FareProps {
  distanceKm: number;
  durationMin: number;
  hours?: number;
  pickup: { lat: any; lng: any };
  dropoff: { lat: any; lng: any };
  encodedPolyline?: string;
}

interface FareResponse {
  perKm: number;
  hourFare: number;
  distanceFare: number;
  tollFare: number;
  fare: number;

}

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


  const calculateFares = async ({
    distanceKm,
    durationMin,
    hours = 0,
    pickup,
    dropoff,
    encodedPolyline
  }: { distanceKm: number; durationMin: number; hours?: number; pickup?: { latitude: number; longitude: number }; dropoff?: { latitude: number; longitude: number }; encodedPolyline?: string }): Promise<Array<{
    car: Car;
    fare: number;
    breakdown: { hourFare: number; distanceFare: number; tollFare: number };
  }>> => {

    // ---- Fare Rates (defaults) ----
    const baseFee = 100;
    const defaultPerKmRate = 40;
    const perMinuteRate = 2;
    const vehicleType = "2AxlesAuto";
    const apiKey = "tg_5D3D8A07AC9F4E08992A106E69640071";

    // ---- TollGuru Toll Calculation (single call for route) ----
    let tollFare = 0;
    if (pickup && dropoff && !tollGuruDisabledForSessionRef.current) {
      try {
        const tollResponse = await axios.post(
          "https://apis.tollguru.com/toll/v2/origin-destination-waypoints",
          {
            from: { lat: pickup.latitude, lng: pickup.longitude },
            to: { lat: dropoff.latitude, lng: dropoff.longitude },
            vehicle: { type: vehicleType },
            polyline: encodedPolyline || undefined
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": apiKey
            }
          }
        );
        // Log status and full payload for debugging
        console.log('TollGuru response status:', tollResponse.status);
        try {
          console.log('TollGuru response data:', JSON.stringify(tollResponse.data, null, 2));
        } catch (e) {
          console.log('TollGuru response data (raw):', tollResponse.data);
        }

        // Normalize extraction — TollGuru returns an array `routes[]`; choose the route that reports tolls
        const data = tollResponse.data || {};

        // Find the most relevant route: prefer one with explicit `tolls` entries, or with costs.tag/expressLanes, or summary.hasTolls
        const routesArray: any[] = Array.isArray(data?.routes) ? data.routes : [];
        let selectedRoute: any = null;
        if (routesArray.length > 0) {
          selectedRoute = routesArray.find((r) => Array.isArray(r.tolls) && r.tolls.length > 0)
            || routesArray.find((r) => r.costs && ((r.costs.tag && r.costs.tag > 0) || r.costs.expressLanes))
            || routesArray.find((r) => r.summary && r.summary.hasTolls)
            || routesArray[0];
        } else {
          selectedRoute = data?.route ?? null;
        }

        let computed = 0;
        if (selectedRoute) {
          try {
            console.log('TollGuru selected route summary:', selectedRoute?.summary?.name ?? selectedRoute?.summary ?? '(no summary)');
          } catch (e) {
            // ignore
          }

          // Sum per-segment tolls on the selected route
          if (Array.isArray(selectedRoute.tolls) && selectedRoute.tolls.length > 0) {
            for (const t of selectedRoute.tolls) {
              const seg = Number(t.tagCost ?? t.tagPriCost ?? t.tag ?? t.tag_cost ?? t.tagCost ?? 0);
              if (!isNaN(seg) && seg > 0) computed += seg;
            }
          }

          // Include express lanes if present on the selected route's costs
          const costs = selectedRoute.costs ?? null;
          if (costs && costs.expressLanes) {
            const el = costs.expressLanes;
            const elCost = Number(el.tagCost ?? el.tag_price ?? el.tagPriCost ?? el.tagPriCost ?? 0);
            if (!isNaN(elCost) && elCost > 0) computed += elCost;
          }

          // Fall back to costs.tag/cash
          if (computed === 0 && costs) {
            const tag = Number(costs.tag ?? costs.tag_cost ?? costs.tag_total ?? costs.tag ?? 0);
            const cash = Number(costs.cash ?? costs.cash_cost ?? costs.cash_total ?? 0);
            if (!isNaN(tag) && tag > 0) computed = tag;
            else if (!isNaN(cash) && cash > 0) computed = cash;
          }

          // Last resort: summary cost
          if (computed === 0) {
            const maybeSummary = selectedRoute?.summary ?? null;
            const maybeCost = maybeSummary?.cost ?? maybeSummary?.costs ?? null;
            if (typeof maybeCost === 'number') computed = maybeCost;
            else if (maybeCost && (maybeCost.tag || maybeCost.cash)) computed = Number(maybeCost.tag ?? maybeCost.cash) || 0;
          }
        }

        tollFare = computed;
        console.log('TollGuru selected route tollFare:', tollFare);


      } catch (error: any) {
        console.log('TollGuru request failed. status:', error?.response?.status, 'data:', error?.response?.data || error?.message);

        // Avoid spamming the console for the same TollGuru error repeatedly
        const key = error?.response?.status + ':' + (error?.response?.data?.message || '');
        const now = Date.now();
        if (lastTollGuruWarnKeyRef.current !== key || now - lastTollGuruWarnAtRef.current > 60_000) {
          console.log("TollGuru Error → No tolls applied:", error?.response?.data || error?.message);
          lastTollGuruWarnKeyRef.current = key;
          lastTollGuruWarnAtRef.current = now;
        }
        if (error?.response?.status === 403) {
          tollGuruDisabledForSessionRef.current = true;
        }
        tollFare = 0;
      }
    }

    // ---- Compute fare per car ----
    return cars.map((car) => {
      const perKmRate = car.perKmRate ?? defaultPerKmRate;
      const hourFare = (hours || 0) * (car.perHourRate ?? 0);
      const distanceFare = distanceKm * perKmRate;
      const timeFare = durationMin * perMinuteRate;
      const rawFare = baseFee + distanceFare + timeFare + hourFare + tollFare;

      const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
      const fare = round2(rawFare);

      return {
        car,
        fare,
        breakdown: { hourFare: round2(hourFare), distanceFare: round2(distanceFare), tollFare: round2(tollFare) }
      };
    });
  };

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
