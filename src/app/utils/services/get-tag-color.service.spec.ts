import { TestBed } from '@angular/core/testing';

import { GetTagColorService } from './get-tag-color.service';

describe('GetTagColorService', () => {
  let service: GetTagColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetTagColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
