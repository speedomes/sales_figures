import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-data',
  templateUrl: './add-data.component.html',
  styleUrls: ['./add-data.component.scss']
})
export class AddDataComponent implements OnInit {

  addDataForm: FormGroup;
  constructor() { }

  ngOnInit() {
    this.addDataForm = new FormGroup({

    });
  }

}
