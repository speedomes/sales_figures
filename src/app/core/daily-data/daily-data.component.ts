import { Component, OnInit, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-daily-data',
  templateUrl: './daily-data.component.html',
  styleUrls: ['./daily-data.component.scss']
})
export class DailyDataComponent implements OnInit {

  selectedIndex: number;
  dailyDataSource =  new MatTableDataSource([
    {
      date: '2018.01.03',
      office: 'Cornwall',
      repId: 172,
      vehicle: null,
      sold: 0,
      pulled: 0,
      clients: 0,
      credit: 0.00,
      balance: -102.22,
      unused: 0,
      in: 0,
      day1: 0,
      day2: 0,
      st: 0,
      name: 'Stuart Thomson'
    },
    {
      date: '2018.01.03',
      office: 'Cornwall',
      repId: 172,
      vehicle: null,
      sold: 0,
      pulled: 0,
      clients: 0,
      credit: 0.00,
      balance: -102.22,
      unused: 0,
      in: 0,
      day1: 0,
      day2: 0,
      st: 0,
      name: 'Stuart Thomson'
    }
  ]);

  displayedColumns: string[] = ['date', 'office', 'repId', 'vehicle', 'sold',
    'pulled', 'clients', 'credit', 'balance', 'unused', 'in', 'day1', 'day2', 'st', 'name'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    this.dailyDataSource.paginator = this.paginator;
    this.dailyDataSource.sort = this.sort;
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }
}
