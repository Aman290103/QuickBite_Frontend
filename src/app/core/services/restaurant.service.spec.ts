import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RestaurantService } from './restaurant.service';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;

  const mockRestaurant = { id: 'r1', name: 'Pizza Place', cuisine: 'Italian', address: '123 St' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestaurantService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RestaurantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch nearby restaurants', () => {
    service.getNearbyRestaurants(40.71, -74.00, 10).subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/restaurants/nearby?lat=40.71&lon=-74&radius=10');
    expect(req.request.method).toBe('GET');
    req.flush([mockRestaurant]);
  });

  it('should get restaurant by id', () => {
    service.getRestaurantById('r1').subscribe(res => {
      expect(res.name).toBe('Pizza Place');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/restaurants/r1');
    expect(req.request.method).toBe('GET');
    req.flush(mockRestaurant);
  });

  it('should submit a review', () => {
    const review = { rating: 5, comment: 'Great!' };
    service.submitReview('r1', review).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/restaurants/r1/reviews');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(review);
    req.flush({});
  });

  it('should approve a restaurant', () => {
    service.approveRestaurant('r1').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/restaurants/r1/approve');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
