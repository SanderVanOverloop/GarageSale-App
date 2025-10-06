import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRoutePage } from './add-route-page';

describe('AddRoutePage', () => {
  let component: AddRoutePage;
  let fixture: ComponentFixture<AddRoutePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRoutePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRoutePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
