import { inject, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="signup-wrapper">
      <div class="form-section">
        <div class="signup-box animate-slide-up">
          <div class="header">
            <h1 class="logo">QuickBite</h1>
            <h2>Create Account</h2>
            <p>Join our community of food lovers</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" #signupForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  [(ngModel)]="userData.fullName" 
                  required 
                  placeholder="John Doe"
                  class="input-field"
                >
              </div>
              
              <div class="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  [(ngModel)]="userData.email" 
                  required 
                  placeholder="john@example.com"
                  class="input-field"
                >
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Phone</label>
                <input 
                  type="text" 
                  name="phone" 
                  [(ngModel)]="userData.phone" 
                  required 
                  placeholder="9876543210"
                  class="input-field"
                >
              </div>
              
              <div class="form-group">
                <label>Join as</label>
                <select 
                  name="role" 
                  [(ngModel)]="userData.role" 
                  required 
                  class="input-field select-field"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="OWNER">Restaurant Owner</option>
                  <option value="DELIVERY_AGENT">Delivery Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                [(ngModel)]="userData.password" 
                required 
                minlength="6"
                placeholder="At least 6 characters"
                class="input-field"
              >
            </div>
            
            @if (error()) {
              <div class="error-toast">
                {{ error() }}
              </div>
            }
            
            <button type="submit" class="btn-primary full-width" [disabled]="loading()">
              {{ loading() ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>
          
          <div class="footer">
            <p>Already have an account? <a routerLink="/login">Login here</a></p>
          </div>
        </div>
      </div>

      <div class="brand-section">
        <div class="hero-image" style="background-image: url('https://images.unsplash.com/photo-1493770348161-369560ae357d?w=1000')"></div>
        <div class="brand-overlay">
          <p class="quote">"Food is not just eating energy. It's an experience."</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .signup-wrapper {
      min-height: 100vh;
      display: flex;
      background: var(--white);
    }
    
    .brand-section {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .hero-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      filter: brightness(0.7);
    }
    
    .brand-overlay {
      position: relative;
      z-index: 1;
      color: white;
      padding: 3rem;
      max-width: 500px;
      text-align: center;
    }
    
    .quote {
      font-size: 2.5rem;
      font-weight: 700;
      font-style: italic;
      line-height: 1.2;
    }
    
    .form-section {
      flex: 1.5;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: var(--bg-light);
    }
    
    .signup-box {
      width: 100%;
      max-width: 600px;
      background: var(--white);
      padding: 3.5rem;
      border-radius: 32px;
      box-shadow: var(--shadow-lg);
    }
    
    .logo {
      font-size: 2.5rem;
      color: var(--primary);
      margin-bottom: 2rem;
    }
    
    .header {
      margin-bottom: 2.5rem;
    }
    
    .header h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .header p {
      color: var(--text-muted);
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .select-field {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23686b78'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1.25rem;
      padding-right: 3rem;
    }
    
    .full-width {
      width: 100%;
      padding: 1rem;
      font-size: 1.125rem;
      margin-top: 1rem;
    }
    
    .error-toast {
      background: #fff5f5;
      color: #e53e3e;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    
    .footer {
      margin-top: 2rem;
      text-align: center;
      color: var(--text-muted);
    }
    
    .footer a {
      color: var(--primary);
      font-weight: 700;
    }
    
    @media (max-width: 1024px) {
      .brand-section { display: none; }
      .form-grid { grid-template-columns: 1fr; gap: 0; }
      .signup-box { padding: 2rem; }
    }
  `]
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userData = {
    fullName: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    password: ''
  };
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    
    this.authService.register(this.userData).subscribe({
      next: () => {
        this.router.navigate(['/login'], { queryParams: { registered: true } });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
