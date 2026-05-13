import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  
  let navigatedPath: any = null;
  const routerSpy = {
    navigate: (path: any) => { navigatedPath = path; }
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    navigatedPath = null;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should login, save token, and fetch profile', () => {
    const mockAuthResponse = { accessToken: 'fake-jwt', refreshToken: 'fake-refresh' };
    const mockUser = { id: 'u1', email: 'test@test.com', fullName: 'Test User', role: 'CUSTOMER', phone: '123' };

    service.login({ email: 'test@test.com', password: 'password' }).subscribe(user => {
      expect(user).toEqual(mockUser as any);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('test@test.com');
      expect(localStorage.getItem('token')).toBe('fake-jwt');
    });

    const loginReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush(mockAuthResponse);

    const profileReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/profile');
    expect(profileReq.request.method).toBe('GET');
    profileReq.flush(mockUser);
  });

  it('should register a new user', () => {
    service.register({ email: 'new@test.com' }).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should logout and clear localStorage', () => {
    // Setup initial state
    localStorage.setItem('token', 'fake');
    localStorage.setItem('user', JSON.stringify({ id: '1' }));
    
    // Create new instance to read localStorage
    const testService = TestBed.inject(AuthService);
    
    testService.logout();
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(testService.isAuthenticated()).toBe(false);
    expect(navigatedPath).toEqual(['/login']);
  });

  it('should correctly check user role', () => {
    service.currentUser.set({ id: '1', role: 'ADMIN', email: 'admin@test.com', fullName: 'Admin', phone: '123' } as any);
    
    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('CUSTOMER')).toBe(false);
  });
});
