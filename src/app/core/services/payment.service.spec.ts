import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should verify payment', () => {
    const paymentData = { orderId: 'o1', amount: 100 };
    service.verifyPayment(paymentData).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/payments/process');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(paymentData);
    req.flush({});
  });
});
