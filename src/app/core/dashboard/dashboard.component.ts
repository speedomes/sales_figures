import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  selectedOffice: string = 'all';
  selectedRep: string = 'all';

  yearlyDataSource;

  displayedColumns: string[] = ['timeFrequency', 'sold', 'pulled', 'holidays', 'newClients', 'credit',
      'interviews', 'tab1', 'tab2', 'percentage'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.fetchDashboardData().subscribe((response) => {
      this.yearlyDataSource = new MatTableDataSource(response);
    });
    this.yearlyDataSource.paginator = this.paginator;
    this.yearlyDataSource.sort = this.sort;
  }

}
