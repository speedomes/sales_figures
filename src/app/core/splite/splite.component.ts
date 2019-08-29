import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-splite',
  templateUrl: './splite.component.html',
  styleUrls: ['./splite.component.scss']
})
export class SpliteComponent implements OnInit {

  selectedIndex: number;
  spliteDataSource =  new MatTableDataSource([
    {
      date: '2018.01.03',
      office: 'Cornwall',
      cash: 388.91,
      cards: 149,
      vehicle: 0,
      total: 537.91
    },
    {
      date: '2018.01.03',
      office: 'Oxford',
      cash: 148,
      cards: 1027.64,
      vehicle: 0,
      total: 1175.64
    }
  ]);

  displayedColumns: string[] = ['date', 'office', 'cash', 'cards', 'vehicle', 'total'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    this.spliteDataSource.paginator = this.paginator;
    this.spliteDataSource.sort = this.sort;
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }
}
