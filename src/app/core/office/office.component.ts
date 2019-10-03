import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataService } from 'src/app/data.service';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-office',
  templateUrl: './office.component.html',
  styleUrls: ['./office.component.scss']
})
export class OfficeComponent implements OnInit {

  officeForm: FormGroup;
  selectedOffice: any;
  officeToModify: string;
  showError: boolean = false;
  selectedIndex: number;
  dataLoaded: boolean = false;
  placeHolderText: string = environment.placeHolderText;

  officeDataSource =  new MatTableDataSource();
  displayedColumns: string[] = ['name'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private dataService: DataService, private snackBar: MatSnackBar, private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.officeForm = new FormGroup({
      officeName: new FormControl('', [Validators.required])
    });

    this.getOffices();
    this.officeDataSource.paginator = this.paginator;
    this.officeDataSource.sort = this.sort;
  }

  populateData(rowData: any, index) {
    this.selectedIndex = index;
    this.selectedOffice = rowData;
    this.officeForm.setValue({ officeName: rowData.name });
  }

  getOffices() {
    this.dataService.getOffices().subscribe((response) => {
      if (response.offices && response.offices.length > 0) {
        this.officeDataSource.data = response.offices;
        this.dataLoaded = true;
      } else {
        this.displaySnackbar('No data found');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  addOffice() {
    if(this.selectedOffice &&
        (this.officeForm.get('officeName').value === this.selectedOffice.name)) {
        this.displaySnackbar('Office already exists!', 'warning');
        return;
    } else {
      this.dataService.addOffice({
        name: this.officeForm.get('officeName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Office has been added successfully');
        this.clearSelection();
        this.getOffices();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  updateOffice() {
    if(this.officeForm.get('officeName').value === this.selectedOffice.name) {
      this.displaySnackbar('No update required');
      return;
    } else {
      this.dataService.updateOffice({
        id: this.selectedOffice.id, 
        name: this.officeForm.get('officeName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Office has been updated successfully');
        this.clearSelection();
        this.getOffices();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  deleteOffice() {
    if(this.officeForm.get('officeName').value !== this.selectedOffice.name) {
      this.displaySnackbar('Please select an office', 'warning');
      return;
    } else {
      this.dataService.deleteOffice({
        id: this.selectedOffice.id
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Office name has been deleted successfully!');
        this.clearSelection();
        this.getOffices();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  clearSelection() {
    this.officeForm.reset();
    this.selectedOffice = undefined;
    this.selectedIndex = undefined;
  }

  displaySnackbar(message: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: message },
      panelClass: className
    });
  }
}
