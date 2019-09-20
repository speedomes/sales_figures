import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-add-data',
  templateUrl: './add-data.component.html',
  styleUrls: ['./add-data.component.scss']
})
export class AddDataComponent implements OnInit {

  addDataForm: FormGroup;
  filterType;
  dataSource =  new MatTableDataSource([
    {
      date: '2019.02.01',
      office: 'Oxford',
      repId: 1231,
      name: 'Roger Pell',
      vehicle: 'BV17VYL',
      sold: 9,
      pulled: 9,
      newClients: 0,
      credit: 404.73,
      balance: 313.48,
      in: 0,
      day1: 0,
      day2: 0
    }
  ]);

  displayedColumns: string[] = ['date', 'office', 'repId', 'name', 'vehicle', 'sold',
      'pulled', 'newClients', 'credit', 'balance', 'in', 'day1', 'day2'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  
  constructor() { }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.addDataForm = new FormGroup({

    });
  }

}
