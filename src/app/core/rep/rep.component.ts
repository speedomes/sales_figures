import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-rep',
  templateUrl: './rep.component.html',
  styleUrls: ['./rep.component.scss']
})
export class RepComponent implements OnInit {

  repForm: FormGroup;
  selectedIndex: number;
  dataLoaded: boolean = false;
  placeHolderText: string = environment.placeHolderText;
  selectedRep;
  repDataSource =  new MatTableDataSource();
  offices: [] = [];
  vehicles: [] = [];
  displayedColumns: string[] = ['id', 'repName', 'officeName', 'vehicleName', 'balance'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.repDataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.repDataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.repForm = new FormGroup({
      id: new FormControl('', [Validators.required]),
      repName: new FormControl('', [Validators.required]),
      balance: new FormControl('', [Validators.required]),
      officeName: new FormControl('', [Validators.required]),
      vehicleName: new FormControl('', [Validators.required])
    });
    this.getReps();

    this.dataService.getOffices().subscribe((response) => {
      if (response && response.offices) {
        this.offices = response.offices;
      }
    });

    this.dataService.getVehicles().subscribe((response) => {
      if (response && response.vehicles) {
        this.vehicles = response.vehicles;
      }
    });
  }

  populateData(rowData: any, index) {
    this.selectedIndex = index;
    this.selectedRep = rowData;

    this.repForm.setValue({
      id: rowData.id,
      repName: rowData.repName,
      balance: rowData.balance,
      officeName: rowData.office_id,
      vehicleName: rowData.vehicle_id
    });
  }

  getReps() {
    this.dataService.getReps().subscribe((response) => {
      if (response.reps && response.reps.length > 0) {
        this.repDataSource.data = response.reps;
        this.dataLoaded = true;
      } else {
        this.displaySnackbar('No data found');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  addRep() {
    if (this.selectedRep &&
        (this.repForm.get('repName').value === this.selectedRep.repName)) {
        this.displaySnackbar('Rep name already exists!', 'warning');
        return;
    } else {
      this.dataService.addRep({
        id: this.repForm.get('id').value, 
        name: this.repForm.get('repName').value,
        balance: this.repForm.get('balance').value,
        officeId: this.repForm.get('officeName').value,
        vehicleId: this.repForm.get('vehicleName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Rep name has been added successfully!');
        this.clearSelection();
        this.getReps();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  updateRep() {
    this.dataService.updateRep({
      id: this.repForm.get('id').value, 
      name: this.repForm.get('repName').value,
      balance: this.repForm.get('balance').value,
      officeId: this.repForm.get('officeName').value,
      vehicleId: this.repForm.get('vehicleName').value
    }).subscribe((response) => {
      this.displaySnackbar((response && response.message) || 'Rep has been updated successfully');
      this.clearSelection();
      this.getReps();
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  deleteRep() {
    if (this.repForm.get('repName').value !== this.selectedRep.repName) {
      this.displaySnackbar('Please select an rep.', 'warning');
      return;
    } else {
      this.dataService.deleteRep({
        id: this.repForm.get('id').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Rep name has been deleted successfully!');
        this.clearSelection();
        this.getReps();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  clearSelection() {
    this.repForm.setValue({
      id: '',
      repName: '',
      balance: '',
      officeName: '',
      vehicleName: ''
    });
    this.selectedRep = undefined;
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
