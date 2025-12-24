import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Booking = {
  id: string;
  // Trip Details
  pickup: string;
  dropoff: string;
  hours: number;
  date: Date;
  time: string;
  passengers: number;
  transferType: 'one-way' | 'two-way';
  // Vehicle
  vehicleId: string;
  vehicleName: string;
  vehicleRate: number;
  // Customer
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  // Calculated
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  totalFare: number;
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  invoiceSent: boolean;
  createdAt: Date;
};

type BookingsContextType = {
  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'id' | 'status' | 'invoiceSent' | 'createdAt'>) => Promise<Booking>;
  updateBooking: (id: string, patch: Partial<Omit<Booking, 'id'>>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  getBooking: (id: string) => Booking | undefined;
  refresh: () => Promise<void>;
};

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);
const STORAGE_KEY = 'bookings_storage_v1';

function generateId() {
  return `BK-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Convert date strings back to Date objects
          const bookingsWithDates = parsed.map((b: any) => ({
            ...b,
            date: new Date(b.date),
            createdAt: new Date(b.createdAt),
          }));
          setBookings(bookingsWithDates);
        }
      } catch (e) {
        console.warn('Failed to load bookings', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
      } catch (e) {
        console.warn('Failed to save bookings', e);
      }
    })();
  }, [bookings]);

  const addBooking = async (b: Omit<Booking, 'id' | 'status' | 'invoiceSent' | 'createdAt'>) => {
    const newBooking: Booking = {
      id: generateId(),
      ...b,
      status: 'confirmed',
      invoiceSent: false,
      createdAt: new Date(),
    };
    setBookings((s) => [newBooking, ...s]);
    return newBooking;
  };

  const updateBooking = async (id: string, patch: Partial<Omit<Booking, 'id'>>) => {
    setBookings((s) => s.map((booking) => (booking.id === id ? { ...booking, ...patch } : booking)));
  };

  const deleteBooking = async (id: string) => {
    setBookings((s) => s.filter((b) => b.id !== id));
  };

  const getBooking = (id: string) => {
    return bookings.find((b) => b.id === id);
  };

  const refresh = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const bookingsWithDates = parsed.map((b: any) => ({
          ...b,
          date: new Date(b.date),
          createdAt: new Date(b.createdAt),
        }));
        setBookings(bookingsWithDates);
      }
    } catch (e) {
      console.warn('Failed to refresh bookings', e);
    }
  };

  return (
    <BookingsContext.Provider value={{ bookings, addBooking, updateBooking, deleteBooking, getBooking, refresh }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used inside BookingsProvider');
  return ctx;
}
