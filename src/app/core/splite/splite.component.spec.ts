import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpliteComponent } from './splite.component';

describe('SpliteComponent', () => {
  let component: SpliteComponent;
  let fixture: ComponentFixture<SpliteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpliteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpliteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
