declare module 'haversine' {
  export interface Coordinates {
    latitude: number;
    longitude: number;
  }

  export interface Options {
    unit?: 'km' | 'mile' | 'meter';
  }

  export default function haversine(
    start: Coordinates,
    end: Coordinates,
    options?: Options
  ): number;
}
