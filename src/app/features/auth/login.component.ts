import { inject, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="brand-section">
        <div class="hero-image" style="background-image: url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000')"></div>
        <div class="brand-overlay">
          <h1 class="brand-logo">QuickBite</h1>
          <p class="brand-tagline">Deliciousness delivered to your doorstep.</p>
        </div>
      </div>
      
      <div class="form-section">
        <div class="login-box animate-slide-up">
          <div class="header">
            <h2>Login</h2>
            <p>Enter your details to satisfy your cravings</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <div class="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="credentials.email" 
                required 
                placeholder="email@example.com"
                class="input-field"
              >
            </div>
            
            <div class="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                [(ngModel)]="credentials.password" 
                required 
                placeholder="••••••••"
                class="input-field"
              >
            </div>
            
            @if (error()) {
              <div class="error-toast">
                {{ error() }}
              </div>
            }
            
            <button type="submit" class="btn-primary full-width" [disabled]="loading()">
              {{ loading() ? 'Signing in...' : 'Login' }}
            </button>
          </form>
          
          <div class="footer">
            <p>New to QuickBite? <a routerLink="/signup">Create account</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      height: 100vh;
      display: flex;
      background: var(--white);
    }
    
    .brand-section {
      flex: 1.2;
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
      filter: brightness(0.6);
      transform: scale(1.1);
      transition: transform 10s linear;
    }
    
    .login-wrapper:hover .hero-image {
      transform: scale(1);
    }
    
    .brand-overlay {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      padding: 2rem;
    }
    
    .brand-logo {
      font-size: 5rem;
      font-weight: 800;
      letter-spacing: -2px;
      margin-bottom: 1rem;
      color: white;
    }
    
    .brand-tagline {
      font-size: 1.5rem;
      font-weight: 300;
      opacity: 0.9;
    }
    
    .form-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--bg-light);
    }
    
    .login-box {
      width: 100%;
      max-width: 420px;
      background: var(--white);
      padding: 3rem;
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
    }
    
    .header {
      margin-bottom: 2.5rem;
      text-align: center;
    }
    
    .header h2 {
      font-size: 2.25rem;
      margin-bottom: 0.5rem;
    }
    
    .header p {
      color: var(--text-muted);
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--secondary);
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
      font-size: 0.875rem;
      border-left: 4px solid #e53e3e;
    }
    
    .footer {
      margin-top: 2.5rem;
      text-align: center;
      color: var(--text-muted);
    }
    
    .footer a {
      color: var(--primary);
      font-weight: 700;
    }
    
    @media (max-width: 1024px) {
      .brand-section { display: none; }
      .form-section { background: var(--white); }
      .login-box { box-shadow: none; padding: 1.5rem; }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = { email: '', password: '' };
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    
    this.authService.login(this.credentials).subscribe({
      next: (user) => {
        this.navigateToDashboard(user.role);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private navigateToDashboard(role?: string) {
    switch (role) {
      case 'ADMIN': this.router.navigate(['/admin']); break;
      case 'OWNER': this.router.navigate(['/owner']); break;
      case 'DELIVERY_AGENT': this.router.navigate(['/agent']); break;
      default: this.router.navigate(['/customer']);
    }
  }
}
