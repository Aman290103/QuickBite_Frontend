import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchService]
    });
    service = TestBed.inject(SearchService);
  });

  it('should update search query', () => {
    service.setQuery('Burger');
    expect(service.searchQuery()).toBe('Burger');
  });
});
