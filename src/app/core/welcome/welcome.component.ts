import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  loginForm: FormGroup;

  constructor(private dataService: DataService,
    private router: Router, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.loginForm = new FormGroup({
      userName: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  login() {
    this.dataService.auth({
      userName: this.loginForm.get('userName').value,
      password: this.loginForm.get('password').value
    }).subscribe((response) => {
      if (response) {
        if (response.isUserValid) {
          localStorage.setItem('isUserLoggedIn', 'true');
          this.router.navigate(['home']);
        } else {
          localStorage.removeItem('isUserLoggedIn');
          this.displaySnackbar('Authentication failed!', 'warning');
        }
      } else {
        localStorage.removeItem('isUserLoggedIn');
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      }
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
