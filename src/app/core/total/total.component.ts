import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import * as moment from 'moment';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-total',
  templateUrl: './total.component.html',
  styleUrls: ['./total.component.scss']
})
export class TotalComponent implements OnInit {

  totalDataForm: FormGroup;
  maxDate = moment().toISOString();
  isDataLoaded = false;
  showSpinner = false;
  placeHolderText: string = environment.placeHolderText;
  dataSource =  new MatTableDataSource();
  displayedColumns: string[] = ['hire_company', 'total'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.totalDataForm = new FormGroup({
      fromDate: new FormControl('', [Validators.required]),
      toDate: new FormControl('', [Validators.required])
    });
  }

  fetchTotalData() {
    this.showSpinner = true;
    this.dataService.getTotalData({
      fromDate: moment(this.totalDataForm.get('fromDate').value).format('YYYY.MM.DD'),
      toDate: moment(this.totalDataForm.get('toDate').value).format('YYYY.MM.DD')
    }).subscribe((response) => {
      this.dataSource.data = response.totalData;
      this.isDataLoaded = true;
      this.showSpinner = false;
    });
  }
}
