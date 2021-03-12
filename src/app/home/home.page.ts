import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Plugins } from '@capacitor/core';
const { Geolocation } = Plugins;

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private afAuth: AngularFireAuth) {
    //this.anonLogin()
  }

  //anonLogin() {
    //this.afAuth.auth.signInAnonymously().then(user => {
     // console.log(user);
   // })
  //}
}
