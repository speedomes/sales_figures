import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-total',
  templateUrl: './total.component.html',
  styleUrls: ['./total.component.scss']
})
export class TotalComponent implements OnInit {

  totalDataForm: FormGroup;
  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.totalDataForm = new FormGroup({
      fromDate: new FormControl('', [Validators.required]),
      toDate: new FormControl('', [Validators.required])
    });
  }

  fetchTotalData() {
    this.dataService.getTotalData({
      fromDate: this.totalDataForm.get('fromDate').value,
      toDate: this.totalDataForm.get('toDate').value
    }).subscribe((response) => {
      console.log(response);
    });
  }
}
