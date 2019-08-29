import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-rep',
  templateUrl: './rep.component.html',
  styleUrls: ['./rep.component.scss']
})
export class RepComponent implements OnInit {

  repForm: FormGroup;
  selectedIndex: number;
  repData = [
    {
    id: '172',
    name: 'Stuart Thomson',
    office: 'Cornwall',
    vehicle: 'Own',
    balance: '100'
    },
    {
      id: '608',
      name: 'Peter Neville',
      office: 'Cornwall',
      vehicle: 'Own',
      balance: '-486'
    }
  ];
  repDataSource =  new MatTableDataSource(this.repData);
  displayedColumns: string[] = ['id', 'name', 'office', 'vehicle', 'balance'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    this.repForm = new FormGroup({
      id: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      balance: new FormControl('', [Validators.required]),
      office: new FormControl('', [Validators.required]),
      vehicle: new FormControl('', [Validators.required])
    });
    this.repDataSource.paginator = this.paginator;
    this.repDataSource.sort = this.sort;
  }

  populateFormDate(row, index) {
    this.selectedIndex = index;
    this.repForm .setValue({
      id: row.id,
      name: row.name,
      balance: row.balance,
      office: row.office,
      vehicle: row.vehicle
    });
  }

  removeRepData() {

  }

  submitRepData() {

  }
}
