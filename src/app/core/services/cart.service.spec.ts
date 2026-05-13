import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);

    // Initial loadCart() call in the constructor
    const req = httpMock.expectOne('http://localhost:8080/api/v1/cart');
    expect(req.request.method).toBe('GET');
    req.flush({ cartId: '123', restaurantId: 'r-1', items: [], subTotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should properly load cart data and update signal', () => {
    const mockCart = { 
      cartId: 'c1', 
      restaurantId: 'r1', 
      items: [{ itemId: 'i1', menuItemId: 'm1', name: 'Pizza', price: 100, quantity: 2, total: 200 }], 
      subTotal: 200, 
      discountAmount: 0, 
      taxAmount: 10, 
      grandTotal: 210 
    };

    service.loadCart().subscribe(cart => {
      expect(cart).toEqual(mockCart);
      expect(service.cart()).toEqual(mockCart);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/cart');
    expect(req.request.method).toBe('GET');
    req.flush(mockCart);
  });

  it('should send DELETE request when clearCart is called', () => {
    service.clearCart().subscribe();

    const deleteReq = httpMock.expectOne('http://localhost:8080/api/v1/cart');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});

    const reloadReq = httpMock.expectOne('http://localhost:8080/api/v1/cart');
    expect(reloadReq.request.method).toBe('GET');
    reloadReq.flush({ cartId: '', restaurantId: '', items: [], subTotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });

    expect(service.cart().items.length).toBe(0);
  });

  it('should calculate local fallback if addToCart network fails', () => {
    service.addToCart('m1', 1, 'r1', 'Res 1', 'Burger', 150).subscribe();

    const postReq = httpMock.expectOne('http://localhost:8080/api/v1/cart/items');
    expect(postReq.request.method).toBe('POST');
    postReq.error(new ProgressEvent('Network error')); // Simulate backend failure

    // Verify fallback calculated the values
    expect(service.cart().items.length).toBe(1);
    expect(service.cart().items[0].name).toBe('Burger');
    expect(service.cart().subTotal).toBe(150);
  });
});
