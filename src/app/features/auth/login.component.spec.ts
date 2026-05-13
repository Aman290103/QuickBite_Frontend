import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let navigatedPath: any = null;
  let loginCalledWith: any = null;

  beforeEach(async () => {
    navigatedPath = null;
    loginCalledWith = null;

    const mockAuthService = {
      login: (creds: any) => {
        loginCalledWith = creds;
        return of({ role: 'CUSTOMER' });
      }
    };
    const mockRouter = {
      navigate: (path: any) => { navigatedPath = path; }
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should call login and navigate to dashboard on submit', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.credentials = { email: 'test@test.com', password: 'password' };
    
    component.onSubmit();
    
    expect(loginCalledWith).toEqual({ email: 'test@test.com', password: 'password' });
    expect(navigatedPath).toEqual(['/customer']);
  });
});
