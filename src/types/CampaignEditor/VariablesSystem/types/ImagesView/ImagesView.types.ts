export interface ImageData {
  nomefile: string;
  percorso: string;
  tipo: string;
  sottotipo: string;
  dimensione: number;
  modificato: string;
  profondita: number;
  thumbnail?: string;
}

export interface ImageCategory {
  id: string;
  label: string;
  count: number;
}

export interface ImagesApiResponse {
  success: boolean;
  data: ImageData[];
  count: number;
  stats: {
    totali_trovate: number;
    dopo_deduplicazione: number;
    duplicate_rimosse: number;
    thumbnail_inclusi?: boolean;
  };
}

export interface ImageBinaryResponse {
  success: boolean;
  data: {
    percorso: string;
    binary: string;
    successo: boolean;
    dimensione: number;
    errore?: string;
    fallback?: string;
  }[];
  stats: {
    richieste: number;
    successo: number;
    fallback: number;
    fallback_disponibile: boolean;
  };
}