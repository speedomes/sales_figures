import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/data.service';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

@Component({
  selector: 'app-add-data',
  templateUrl: './add-data.component.html',
  styleUrls: ['./add-data.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: {
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY'
      }
    }}
  ]
})
export class AddDataComponent implements OnInit {

  filterType: string;
  dataForm: FormGroup;
  dataEntryForm: FormGroup;
  existingOrderId;
  hasSplitData = false;
  splitDataId: number;
  maxDate = moment().toISOString();

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
      date: new FormControl({ value: '', disabled: true}, [Validators.required]),
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
      viu: new FormControl(''),
      repWSold: new FormControl(''),
      repWPulled: new FormControl(''),
      repWNewClients: new FormControl(''),
      repWCredit: new FormControl(''),
      repWInt: new FormControl(''),
      repWTra1: new FormControl(''),
      repWTra2: new FormControl(''),
      repMSold: new FormControl(''),
      repMPulled: new FormControl(''),
      repMNewClients: new FormControl(''),
      repMCredit: new FormControl(''),
      repMInt: new FormControl(''),
      repMTra1: new FormControl(''),
      repMTra2: new FormControl(''),
      repYSold: new FormControl(''),
      repYPulled: new FormControl(''),
      repYNewClients: new FormControl(''),
      repYCredit: new FormControl(''),
      repYInt: new FormControl(''),
      repYTra1: new FormControl(''),
      repYTra2: new FormControl(''),
      officeWSold: new FormControl(''),
      officeWPulled: new FormControl(''),
      officeWNewClients: new FormControl(''),
      officeWCredit: new FormControl(''),
      officeWInt: new FormControl(''),
      officeWTra1: new FormControl(''),
      officeWTra2: new FormControl(''),
      officeMSold: new FormControl(''),
      officeMPulled: new FormControl(''),
      officeMNewClients: new FormControl(''),
      officeMCredit: new FormControl(''),
      officeMInt: new FormControl(''),
      officeMTra1: new FormControl(''),
      officeMTra2: new FormControl(''),
      officeYSold: new FormControl(''),
      officeYPulled: new FormControl(''),
      officeYNewClients: new FormControl(''),
      officeYCredit: new FormControl(''),
      officeYInt: new FormControl(''),
      officeYTra1: new FormControl(''),
      officeYTra2: new FormControl('')
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
    this.dataEntryForm.patchValue({
      repVehicle: '',
      repSold: '',
      repPulled: '',
      repNC: '',
      repCredit: '',
      repInt: '',
      repDay1: '',
      repDay2: '',
      repBalance: '',
      repBalanceB: '',
      officeSold: '',
      officePulled: '',
      officeNewClients: '',
      officeCredit: '',
      officeInt: '',
      officeDay1: '',
      officeDay2: '',
      cash: '',
      cards: '',
      totalPayment: '',
      viu: ''
    });

    if (id!== '' && id!== 'all') {
      this.dataEntryForm.patchValue({ rep: ''});
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
    } else {
      this.dataEntryForm.get('date').disable();
      this.doFilter.reps = [];
      this.dataEntryForm.patchValue({
        rep: ''
      });
    }
  }

  repChanged() {
    this.dataEntryForm.get('date').enable();
    if (this.dataEntryForm.get('date').value && this.dataEntryForm.get('date').value !== '') {
      this.checkRecord(true);
    }
  }

  checkRecord(isRepChanged = false) {
    this.resetKPIData();
    const dateToFilter = moment(this.dataEntryForm.get('date').value).format('YYYY.MM.DD');

    const data = {
      repId: this.dataEntryForm.get('rep').value,
      officeId: this.dataEntryForm.get('office').value,
      date: dateToFilter
    };

    this.dataService.checkRecord(data).subscribe((response: any) => {
      console.log(response);
      if (response.records.length > 0) {
        const record = response.records[0];
        this.existingOrderId = record && record.id;
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
          repVehicle: record.vehicle_id
        };
        this.dataEntryForm.patchValue(repData);
      } else {
        this.dataEntryForm.patchValue({
          repSold: '',
          repPulled: '',
          repNC: '',
          repCredit: '',
          repInt: '',
          repDay1: '',
          repDay2: ''
        });
        this.displaySnackbar('No Rep data found');
      }

      if (response.officeRecords.length > 0) {
        const officeRecord = response.officeRecords[0];
        const officeData = {
          officeSold: officeRecord.sold || '',
          officePulled: officeRecord.pulled || '',
          officeNewClients: officeRecord.newClients || '',
          officeCredit: officeRecord.credit || '',
          officeInt: officeRecord.inuse || '',
          officeDay1: officeRecord.day1 || '',
          officeDay2: officeRecord.day2 || ''
        };
        this.dataEntryForm.patchValue(officeData);
      } else {
        this.dataEntryForm.patchValue({
          officeSold: '',
          officePulled: '',
          officeNewClients: '',
          officeCredit: '',
          officeInt: '',
          officeDay1: '',
          officeDay2: '',
          cash: '',
          cards: '',
          totalPayment: '',
          viu: ''
        });
        this.displaySnackbar('No Office data found');
      }

      if (response.splitRecords.length > 0) {
        this.hasSplitData = true;
        const splitRecord = response.splitRecords[0];
        this.splitDataId = splitRecord.id;
        const splitData = {
          cash: splitRecord.cash || '',
          cards: splitRecord.cards || '',
          totalPayment: (splitRecord.cash + splitRecord.cards).toFixed(2),
          viu: splitRecord.viu || ''
        };
        this.dataEntryForm.patchValue(splitData);
      } else {
        const splitData = {
          cash: '',
          cards: '',
          totalPayment: '',
          viu: ''
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
      this.displaySnackbar('Record has been saved successfully');
      this.resetForm();
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
      this.displaySnackbar('Record data has been updated successfully');
      this.resetForm();
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  saveSplit() {
    const splitRecord = {
      cash: this.dataEntryForm.get('cash').value || 0,
      cards: this.dataEntryForm.get('cards').value || 0,
      viu: this.dataEntryForm.get('viu').value || 0,
      officeId: this.dataEntryForm.get('office').value,
      date: this.dataEntryForm.get('date').value,
      id: this.splitDataId || -1
    };

    if (this.hasSplitData) {
      this.dataService.updateSplit(splitRecord).subscribe((response: any) => {
        this.displaySnackbar('Split data has been updated successfully');
        this.hasSplitData = false;
        this.resetForm();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    } else {
      this.dataService.saveSplit(splitRecord).subscribe((response: any) => {
        this.displaySnackbar('Split data has been saved successfully');
        this.hasSplitData = false;
        this.resetForm();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  getKPIData() {
    const filterConfig = {
      date: this.dataEntryForm.get('date').value,
      repId: this.dataEntryForm.get('rep').value,
      officeId: this.dataEntryForm.get('office').value
    };

    this.dataService.getKPIData(filterConfig).subscribe((response: any) => {
      if (Object.entries(response.data).length > 0) {
        this.dataEntryForm.patchValue({
          repWSold: response.data.repWSold,
          repWPulled: response.data.repWPulled,
          repWNewClients: response.data.repWNewClients,
          repWCredit: response.data.repWCredit.toFixed(2),
          repWInt: response.data.repWInt,
          repWTra1: response.data.repWTra1,
          repWTra2: response.data.repWTra2,
          repMSold: response.data.repMSold,
          repMPulled: response.data.repMPulled,
          repMNewClients: response.data.repMNewClients,
          repMCredit: response.data.repMCredit.toFixed(2),
          repMInt: response.data.repMInt,
          repMTra1: response.data.repMTra1,
          repMTra2: response.data.repMTra2,
          repYSold: response.data.repYSold,
          repYPulled: response.data.repYPulled,
          repYNewClients: response.data.repYNewClients,
          repYCredit: response.data.repYCredit.toFixed(2),
          repYInt: response.data.repYInt,
          repYTra1: response.data.repYTra1,
          repYTra2: response.data.repYTra2,
          officeWSold: response.data.officeWSold,
          officeWPulled: response.data.officeWPulled,
          officeWNewClients: response.data.officeWNewClients,
          officeWCredit: response.data.officeWCredit.toFixed(2),
          officeWInt: response.data.officeWInt,
          officeWTra1: response.data.officeWTra1,
          officeWTra2: response.data.officeWTra2,
          officeMSold: response.data.officeMSold,
          officeMPulled: response.data.officeMPulled,
          officeMNewClients: response.data.officeMNewClients,
          officeMCredit: response.data.officeMCredit.toFixed(2),
          officeMInt: response.data.officeMInt,
          officeMTra1: response.data.officeMTra1,
          officeMTra2: response.data.officeMTra2,
          officeYSold: response.data.officeYSold,
          officeYPulled: response.data.officeYPulled,
          officeYNewClients: response.data.officeYNewClients,
          officeYCredit: response.data.officeYCredit.toFixed(2),
          officeYInt: response.data.officeYInt,
          officeYTra1: response.data.officeYTra1,
          officeYTra2: response.data.officeYTra2
        });
      } else {
        this.displaySnackbar('No data found');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  resetForm() {
    this.dataEntryForm.patchValue({
      rep: '',
      repSold: '',
      repPulled: '',
      repNC: '',
      repCredit: '',
      repInt: '',
      repDay1: '',
      repDay2: '',
      officeSold: '',
      officePulled: '',
      officeNewClients: '',
      officeCredit: '',
      officeInt: '',
      officeDay1: '',
      officeDay2: '',
      cash: '',
      cards: '',
      totalPayment: '',
      viu: ''
    });
  }

  resetKPIData() {
    this.dataEntryForm.patchValue({
      repWSold: '',
      repWPulled: '',
      repWNewClients: '',
      repWCredit: '',
      repWInt: '',
      repWTra1: '',
      repWTra2: '',
      repMSold: '',
      repMPulled: '',
      repMNewClients: '',
      repMCredit: '',
      repMInt: '',
      repMTra1: '',
      repMTra2: '',
      repYSold: '',
      repYPulled: '',
      repYNewClients: '',
      repYCredit: '',
      repYInt: '',
      repYTra1: '',
      repYTra2: '',
      officeWSold: '',
      officeWPulled: '',
      officeWNewClients: '',
      officeWCredit: '',
      officeWInt: '',
      officeWTra1: '',
      officeWTra2: '',
      officeMSold: '',
      officeMPulled: '',
      officeMNewClients: '',
      officeMCredit: '',
      officeMInt: '',
      officeMTra1: '',
      officeMTra2: '',
      officeYSold: '',
      officeYPulled: '',
      officeYNewClients: '',
      officeYCredit: '',
      officeYInt: '',
      officeYTra1: '',
      officeYTra2: ''
    });
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: environment.snackBarTimeOut,
      data: { message: msg },
      panelClass: className
    });
  }
}
