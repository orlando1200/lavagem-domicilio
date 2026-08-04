import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MapsService } from '../../../src/modules/maps/maps.service';

// Sao Paulo (SP) e Rio de Janeiro (RJ), ~360km em linha reta.
const ORIGIN = { lat: -23.5505, lng: -46.6333 };
const DESTINATION = { lat: -22.9068, lng: -43.1729 };

describe('MapsService', () => {
  let service: MapsService;
  let config: { get: jest.Mock };
  const originalFetch = global.fetch;

  beforeEach(async () => {
    config = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MapsService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = module.get<MapsService>(MapsService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('getDistance (mock/haversine)', () => {
    it('falls back to a local estimate when no API key is configured', async () => {
      const result = await service.getDistance(ORIGIN, DESTINATION);

      expect(result.source).toBe('mock');
      expect(result.distanceKm).toBeGreaterThan(300);
      expect(result.distanceKm).toBeLessThan(420);
      expect(result.durationMinutes).toBeGreaterThan(0);
    });

    it('falls back to a local estimate when the Google API call fails', async () => {
      config.get.mockReturnValue('fake-api-key');
      global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

      const result = await service.getDistance(ORIGIN, DESTINATION);

      expect(result.source).toBe('mock');
    });
  });

  describe('getDistance (Google Distance Matrix)', () => {
    it('uses the Google API result when an API key is configured and the call succeeds', async () => {
      config.get.mockReturnValue('fake-api-key');
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            rows: [{ elements: [{ status: 'OK', distance: { value: 360000 }, duration: { value: 14400 } }] }],
          }),
      }) as unknown as typeof fetch;

      const result = await service.getDistance(ORIGIN, DESTINATION);

      expect(result).toEqual({ distanceKm: 360, durationMinutes: 240, source: 'google_maps' });
    });
  });

  describe('calculateDeliveryFee', () => {
    it('applies the base fee plus a per-km rate', () => {
      expect(service.calculateDeliveryFee(0)).toBe(5);
      expect(service.calculateDeliveryFee(10)).toBe(20);
    });
  });
});
