import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  selectedOffice: string = 'all';
  selectedRep: string = 'all';

  yearlyDataSource =  new MatTableDataSource([
    {
      timeFrequency: 2018,
      sold: 70575,
      pulled: 70241,
      holidays: 1909,
      newClients: 10118,
      credit: 2442966.53,
      interviews: 1120,
      tab1: 152,
      tab2: 43,
      percentage: 28.29
    }
  ]);

  displayedColumns: string[] = ['timeFrequency', 'sold', 'pulled', 'holidays', 'newClients', 'credit',
      'interviews', 'tab1', 'tab2', 'percentage'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    this.yearlyDataSource.paginator = this.paginator;
    this.yearlyDataSource.sort = this.sort;
  }

}
