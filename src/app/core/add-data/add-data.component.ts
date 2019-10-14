import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/data.service';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-data',
  templateUrl: './add-data.component.html',
  styleUrls: ['./add-data.component.scss']
})
export class AddDataComponent implements OnInit {

  filterType: string;
  dataForm: FormGroup;
  dataEntryForm: FormGroup;
  isEnableSaveRecord: boolean = false;
  existingOrderId;

  doFilter = {
    offices: [],
    reps: []
  };

  offices: [] = [];
  reps: [] = [];
  vehicles: [] = [];
  years: [] = [];

  displayedColumns: string[] = ['date', 'officeName', 'repId', 'repName', 'vehicle', 'sold',
      'pulled', 'newClients', 'credit', 'balance', 'inuse', 'day1', 'day2'];

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataEntryForm = new FormGroup({
      office: new FormControl('', [Validators.required]),
      rep: new FormControl('', [Validators.required]),
      repSold: new FormControl(''),
      repPulled: new FormControl(''),
      repNC: new FormControl(''),
      repCredit: new FormControl(''),
      repInt: new FormControl(''),
      repDay1: new FormControl(''),
      repDay2: new FormControl(''),
      repBalance: new FormControl(''),
      repBalanceB: new FormControl(''),
      repVehicle: new FormControl(''),
      date: new FormControl('', [Validators.required]),
      officeSold: new FormControl(''),
      officePulled: new FormControl(''),
      officeNewClients: new FormControl(''),
      officeCredit: new FormControl(''),
      officeInt: new FormControl(''),
      officeDay1: new FormControl(''),
      officeDay2: new FormControl(''),
      cash: new FormControl(''),
      cards: new FormControl(''),
      totalPayment: new FormControl(''),
      viu: new FormControl('')
    });

    this.dataService.getOffices().subscribe((response) => {
      if (response) {
        this.doFilter.offices = response.offices;
      } else {
        this.displaySnackbar('No data found', 'warning');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });

    this.dataService.getVehicles().subscribe((response) => {
      if (response) {
        this.vehicles = response.vehicles;
      } else {
        this.displaySnackbar('No data found', 'warning');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  fetchRepsByOffice(id) {
    if (id!== '' && id!== 'all') {
      this.dataService.getReps({officeId: id}).subscribe((response) => {
        if (response) {
          this.doFilter.reps = response.reps;
        } else {
          this.displaySnackbar('No data found', 'warning');
        }
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  checkRecord() {
    const data = {
      repId: this.dataEntryForm.get('rep').value,
      officeId: this.dataEntryForm.get('office').value,
      date: this.dataEntryForm.get('date').value
    };

    this.dataService.checkRecord(data).subscribe((response: any) => {
      this.isEnableSaveRecord = true;
      if (response.records.length > 0) {
        const record = response.records[0];
        this.existingOrderId = record.id;
        const repData = {
          repSold: record.sold,
          repPulled: record.pulled,
          repNC: record.newclients,
          repCredit: record.credit,
          repInt: record.inuse,
          repDay1: record.t1,
          repDay2: record.t2,
          repBalance: record.balance,
          repBalanceB: record.balanceb,
          repVehicle: record.vehicle_id,
        };
        this.dataEntryForm.patchValue(repData);
      }

      if (response.officeRecords.length > 0) {
        const officeRecord = response.officeRecords[0];
        const officeData = {
          officeSold: officeRecord.sold,
          officePulled: officeRecord.pulled,
          officeNewClients: officeRecord.newClients,
          officeCredit: officeRecord.credit,
          officeInt: officeRecord.inuse,
          officeDay1: officeRecord.day1,
          officeDay2: officeRecord.day2
        };
        this.dataEntryForm.patchValue(officeData);
      }

      if (response.splitRecords.length > 0) {
        const splitRecord = response.splitRecords[0];
        const splitData = {
          cash: splitRecord.cash,
          cards: splitRecord.cards,
          totalPayment: (splitRecord.cash + splitRecord.cards).toFixed(2),
          viu: splitRecord.viu
        };
        this.dataEntryForm.patchValue(splitData);
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  chooseRecordAction() {
    if (this.existingOrderId) {
      this.updateRecord();
    } else {
      this.addRecord();
    }
    this.dataEntryForm.reset();
  }

  addRecord() {
    const recordDetails = {
      date: this.dataEntryForm.get('date').value,
      vehicleId: this.dataEntryForm.get('repVehicle').value,
      sold: this.dataEntryForm.get('repSold').value,
      pulled: this.dataEntryForm.get('repPulled').value,
      newClients: this.dataEntryForm.get('repNC').value,
      credit: this.dataEntryForm.get('repCredit').value,
      balance: this.dataEntryForm.get('repBalance').value,
      inuse: this.dataEntryForm.get('repInt').value,
      day1: this.dataEntryForm.get('repDay1').value,
      day2: this.dataEntryForm.get('repDay2').value,
      repId: this.dataEntryForm.get('rep').value,
      balanceB: this.dataEntryForm.get('repBalanceB').value
    };

    this.dataService.addRecord(recordDetails).subscribe((response: any) => {
      console.log(response);
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  updateRecord() {
    const recordDetails = {
      date: this.dataEntryForm.get('date').value,
      vehicleId: this.dataEntryForm.get('repVehicle').value,
      sold: this.dataEntryForm.get('repSold').value,
      pulled: this.dataEntryForm.get('repPulled').value,
      newClients: this.dataEntryForm.get('repNC').value,
      credit: this.dataEntryForm.get('repCredit').value,
      balance: this.dataEntryForm.get('repBalance').value,
      inuse: this.dataEntryForm.get('repInt').value,
      day1: this.dataEntryForm.get('repDay1').value,
      day2: this.dataEntryForm.get('repDay2').value,
      repId: this.dataEntryForm.get('rep').value,
      balanceB: this.dataEntryForm.get('repBalanceB').value,
      orderId: this.existingOrderId
    };

    this.dataService.updateRecord(recordDetails).subscribe((response: any) => {
      console.log(response);
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  saveSplit() {
    const splitRecord = {
      cash: this.dataEntryForm.get('cash').value,
      cards: this.dataEntryForm.get('cards').value,
      viu: this.dataEntryForm.get('viu').value
    };

    this.dataService.saveSplit(splitRecord).subscribe((response: any) => {
      console.log(response);
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: msg },
      panelClass: className
    });
  }
}
