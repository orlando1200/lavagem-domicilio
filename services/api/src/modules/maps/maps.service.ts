import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'google_maps' | 'mock';
}

const EARTH_RADIUS_KM = 6371;
const MOCK_AVERAGE_SPEED_KMH = 30;

/**
 * Taxa de entrega: valor base + valor por km. Nao ha tabela de precos
 * definida em nenhum outro lugar do produto — assumida aqui, constantes
 * isoladas para ajustar quando o produto definir a regra oficial.
 */
const DELIVERY_BASE_FEE = 5;
const DELIVERY_FEE_PER_KM = 1.5;

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Distancia/duracao entre dois pontos via Google Distance Matrix API
   * quando `GOOGLE_MAPS_API_KEY` esta configurada; cai para um calculo
   * local (haversine + velocidade media assumida) sem chave configurada
   * ou se a chamada a API falhar, para nunca quebrar matching/calculo de
   * frete por causa de uma API externa fora do ar.
   */
  async getDistance(origin: LatLng, destination: LatLng): Promise<DistanceResult> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');

    if (apiKey) {
      try {
        return await this.getDistanceFromGoogle(origin, destination, apiKey);
      } catch (error) {
        this.logger.warn(
          `Falha ao consultar Google Distance Matrix, caindo para calculo local: ${(error as Error).message}`,
        );
      }
    }

    return this.getDistanceMock(origin, destination);
  }

  calculateDeliveryFee(distanceKm: number): number {
    return Number((DELIVERY_BASE_FEE + distanceKm * DELIVERY_FEE_PER_KM).toFixed(2));
  }

  private async getDistanceFromGoogle(
    origin: LatLng,
    destination: LatLng,
    apiKey: string,
  ): Promise<DistanceResult> {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
    url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Distance Matrix respondeu HTTP ${response.status}`);
    }

    const body = await response.json();
    const element = body?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`Google Distance Matrix nao retornou uma rota valida (status: ${element?.status})`);
    }

    return {
      distanceKm: Number((element.distance.value / 1000).toFixed(2)),
      durationMinutes: Math.round(element.duration.value / 60),
      source: 'google_maps',
    };
  }

  private getDistanceMock(origin: LatLng, destination: LatLng): DistanceResult {
    const distanceKm = Number(this.haversineKm(origin, destination).toFixed(2));
    const durationMinutes = Math.round((distanceKm / MOCK_AVERAGE_SPEED_KMH) * 60);

    return { distanceKm, durationMinutes, source: 'mock' };
  }

  private haversineKm(origin: LatLng, destination: LatLng): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(destination.lat - origin.lat);
    const dLng = toRad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }
}
