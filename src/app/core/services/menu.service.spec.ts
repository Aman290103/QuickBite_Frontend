import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MenuService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MenuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch menu categories', () => {
    service.getMenu('r1').subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/menu/r1');
    expect(req.request.method).toBe('GET');
    req.flush({ categories: [{ id: 'c1', name: 'Mains', items: [] }] });
  });

  it('should search menu items', () => {
    service.searchMenu('r1', 'pizza').subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/menu/r1/search?name=pizza');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'i1', name: 'Pizza' }]);
  });
});
