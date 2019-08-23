import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepComponent } from './rep.component';

describe('RepComponent', () => {
  let component: RepComponent;
  let fixture: ComponentFixture<RepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
