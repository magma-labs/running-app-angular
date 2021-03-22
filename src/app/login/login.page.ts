import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';
import {Router} from "@angular/router"
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {

  locations: Observable<any>;
  locationsCollection: AngularFirestoreCollection<any>;
  usersCollection: AngularFirestoreCollection<any>;
  isLogin: Boolean = false;
  user = null;
  newUser = null;
  email: string = '';
  password: string = '';
  height: string = '0';
  weight: string = '0';

  constructor(
    private afAuth: AngularFireAuth, 
    private afs: AngularFirestore, 
    private router: Router, 
    public alertController: AlertController,
    private storage: Storage
  ) {
    this.login();
    this.ngOnInit();
  }

  async ngOnInit() {

    const storage = await this.storage.create();
    this.storage = storage;
  }

  changeForm(){
    this.isLogin = !this.isLogin;
  }

  async presentAlert(error) {
    this.email = '';
    this.password = '';

    console.log('error =>', error);
    if(error.code == 'auth/wrong-password' || error.code == 'auth/user-not-found'){
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'Error!',
        subHeader: 'Credenciales invalidas',
        message: 'Su contrasena o email son incorrectos',
        buttons: ['OK']
      });
  
      await alert.present();
    }
    
  }

  login() {

    this.afAuth.signInWithEmailAndPassword(this.email, this.password).then(res => {
      
      this.router.navigate(['/home'])

      // TODO: change this hardcoded value for: this.user.uid
      this.locationsCollection = this.afs.collection(
        `locations/${this.user.uid}/track`,
        ref => ref.orderBy('timestamp')
      );

      this.locations = this.locationsCollection.snapshotChanges().pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };

            console.log('locations', id, data);
          })
        )
      );

    }).catch(error =>  
        this.presentAlert(error)
      );
  }

 async signup() {

    this.afAuth.createUserWithEmailAndPassword(this.email, this.password).then(res => {
      this.user = res.user;
      
      console.log('user ->', this.user)
      if(this.user.email){
        this.router.navigate(['/home']);

        let id = this.afs.createId();

        this.newUser = {
          email: this.user.email,
          weight: Number(this.weight),
          height: Number(this.height)
        }

        this.afs.collection('users').doc(id).set(this.newUser).then();

      }
      // TODO: change this hardcoded value for: this.user.uid
      this.locationsCollection = this.afs.collection(
        `locations/${this.user.uid}/track`,
        ref => ref.orderBy('timestamp')
      );

      this.locations = this.locationsCollection.snapshotChanges().pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
    });

    const userValues = JSON.stringify({email: this.email, logged: true})

    await this.storage.set('user', userValues);

  }

}
