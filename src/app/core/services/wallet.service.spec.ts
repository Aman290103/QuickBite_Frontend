import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WalletService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WalletService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get balance', () => {
    service.getBalance().subscribe(res => {
      expect(res.balance).toBe(500);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/paywallet/balance');
    expect(req.request.method).toBe('GET');
    req.flush({ balance: 500 } as any);
  });

  it('should add money to wallet', () => {
    service.addMoney(100).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/paywallet/add');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.amount).toBe(100);
    req.flush({});
  });
});
