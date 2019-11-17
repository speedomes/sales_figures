import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-hire-company',
  templateUrl: './hire-company.component.html',
  styleUrls: ['./hire-company.component.scss']
})
export class HireCompanyComponent implements OnInit {

  hireCompanyForm: FormGroup;
  selectedHireCompany: any;
  hireCompanyToModify: string;
  showError = false;
  selectedIndex: number;
  dataLoaded = false;
  placeHolderText: string = environment.placeHolderText;

  hireCompanyDataSource =  new MatTableDataSource();
  displayedColumns: string[] = ['name'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.hireCompanyDataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.hireCompanyDataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.hireCompanyForm = new FormGroup({
      hireCompanyName: new FormControl('', [Validators.required])
    });

    this.getHireCompanies();
    this.hireCompanyDataSource.paginator = this.paginator;
    this.hireCompanyDataSource.sort = this.sort;
  }

  populateData(rowData: any, index) {
    this.selectedIndex = index;
    this.selectedHireCompany = rowData;
    this.hireCompanyForm.setValue({ hireCompanyName: rowData.name });
  }

  getHireCompanies() {
    this.dataService.getHireCompanies().subscribe((response) => {
      if (response.hireCompanies && response.hireCompanies.length > 0) {
        this.hireCompanyDataSource.data = response.hireCompanies;
        this.dataLoaded = true;
      } else {
        this.displaySnackbar('No data found');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  addHireCompany() {
    if (this.selectedHireCompany &&
      (this.hireCompanyForm.get('hireCompanyName').value === this.selectedHireCompany.name)) {
      this.displaySnackbar('Hire Company already exists!', 'warning');
      return;
    } else {
      this.dataService.addHireCompany({
        name: this.hireCompanyForm.get('hireCompanyName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Hire Company has been added successfully');
        this.clearSelection();
        this.getHireCompanies();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  updateHireCompany() {
    if (this.hireCompanyForm.get('hireCompanyName').value === this.selectedHireCompany.name) {
      this.displaySnackbar('No update required');
      return;
    } else {
      this.dataService.updateHireCompany({
        id: this.selectedHireCompany.id,
        name: this.hireCompanyForm.get('hireCompanyName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Hire Company has been updated successfully');
        this.clearSelection();
        this.getHireCompanies();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  deleteHireCompany() {
    if (this.hireCompanyForm.get('hireCompanyName').value !== this.selectedHireCompany.name) {
      this.displaySnackbar('Please select an Hire Company', 'warning');
      return;
    } else {
      this.dataService.deleteHireCompany({
        id: this.selectedHireCompany.id
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Hire Company name has been deleted successfully!');
        this.clearSelection();
        this.getHireCompanies();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  clearSelection() {
    this.hireCompanyForm.reset();
    this.selectedHireCompany = undefined;
    this.selectedIndex = undefined;
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: environment.snackBarTimeOut,
      data: { message: msg },
      panelClass: className
    });
  }
}
