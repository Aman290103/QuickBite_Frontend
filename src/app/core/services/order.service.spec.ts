import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const mockOrder = { id: 'o1', status: 'PLACED', totalAmount: 100 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should place an order', () => {
    service.placeOrder({ items: [] }).subscribe(res => {
      expect(res).toEqual(mockOrder as any);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/orders');
    expect(req.request.method).toBe('POST');
    req.flush(mockOrder);
  });

  it('should get customer history', () => {
    service.getCustomerHistory().subscribe(orders => {
      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe('o1');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/orders/customer');
    expect(req.request.method).toBe('GET');
    req.flush([mockOrder]);
  });

  it('should get order by id', () => {
    service.getOrderById('o1').subscribe(order => {
      expect(order).toEqual(mockOrder as any);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/orders/o1');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  it('should update order status', () => {
    service.updateOrderStatus('o1', 'DELIVERED').subscribe(res => {
      expect(res.status).toBe('DELIVERED');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/orders/o1/status');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ newStatus: 'DELIVERED' });
    req.flush({ ...mockOrder, status: 'DELIVERED' });
  });

  it('should assign agent to order', () => {
    service.assignAgent('o1', 'a1').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/orders/o1/assign-agent?agentId=a1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockOrder);
  });
});
