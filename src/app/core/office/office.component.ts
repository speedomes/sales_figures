import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-office',
  templateUrl: './office.component.html',
  styleUrls: ['./office.component.scss']
})
export class OfficeComponent implements OnInit {

  selectedOffice: string;
  officeToModify: string;
  showError: boolean = false;

  officeData = [
    { office: 'Cornwall' },
    { office: 'Oxford' }
  ];

  officeDataSource =  new MatTableDataSource(this.officeData);
  displayedColumns: string[] = ['office'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    this.officeDataSource.paginator = this.paginator;
    this.officeDataSource.sort = this.sort;
  }

  populateData(rowData: any) {
    this.selectedOffice = rowData.office;
    this.officeToModify = rowData.office;
  }

  addOfficeData() {
    this.showError = false;

    this.officeDataSource.data.filter((value) => {
      if (value.office === this.selectedOffice) {
        this.showError = true;
      }
      return true;
    });

    if (!this.showError) {
      this.officeDataSource.data.push({ office: this.selectedOffice });
      this.officeDataSource.filter = '';
      this.showError = false;
    }
  }

  updateOfficeData() {
    this.officeDataSource.data.filter((value) => {
      if (value.office === this.officeToModify) {
        value.office = this.selectedOffice;
        this.officeToModify = this.selectedOffice;
      }
      return true;
    });
  }

  removeOfficeData() {
    this.officeDataSource.data.filter((value, index) => {
      if ((this.officeToModify && value.office === this.officeToModify)
        || (value.office === this.selectedOffice)) {
        this.officeDataSource.data.splice(index, 1);
        this.officeDataSource.filter = '';
        this.clearSelection();
      }
      return true;
    });
  }

  clearSelection() {
    this.selectedOffice = undefined;
    this.officeToModify = undefined;
  }

}
