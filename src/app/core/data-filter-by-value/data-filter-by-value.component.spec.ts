import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFilterByValueComponent } from './data-filter-by-value.component';

describe('DataFilterByValueComponent', () => {
  let component: DataFilterByValueComponent;
  let fixture: ComponentFixture<DataFilterByValueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataFilterByValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataFilterByValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
