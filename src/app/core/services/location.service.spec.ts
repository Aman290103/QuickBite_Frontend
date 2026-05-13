import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocationService]
    });
    service = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set manual address', () => {
    service.setAddress('New Location, City');
    expect(service.address()).toBe('New Location, City');
  });
});
