export type MapMarkerKind =
  | "JOB"
  | "TRAINING"
  | "APPRENTICESHIP"
  | "GOVERNMENT"
  | "CENTRE";

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  title: string;
  subtitle: string;
  locationId: string;
  locationName: string;
  district: string;
  lat: number;
  lng: number;
  href: string;
  salary: number | null;
  matchScore: number | null;
  distanceKm: number | null;
}

export interface MapOrigin {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}
