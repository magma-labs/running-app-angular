import { Component, ElementRef, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Plugins } from '@capacitor/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Chronometer, StatusChonometer } from 'ngx-chronometer';

const { Geolocation } = Plugins;
declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  locations: Observable<any>;
  locationsCollection: AngularFirestoreCollection<any>;
  user = null;
  chronometer: Chronometer = new Chronometer();

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  markers = [];
  isTracking = false;
  watch = null;
  markerA = null;
  markerB = null;
  distanceInMeters = null;
  calories = 0;
  avgrating = 0;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.anonLogin();
  }

  ionViewWillEnter(){
   this.loadMap();
  }

  loadMap() {
    const latLong = new google.maps.LatLng(19.1113766, -104.2876191);

    const mapOptions = {
      center: latLong,
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
  }

  anonLogin() {
    this.afAuth.signInAnonymously().then(res => {
      this.user = res.user;

      // TODO: change this hardcoded value for: this.user.uid
      this.locationsCollection = this.afs.collection(
        `locations/UU46w8P8ASfvMtUkbR8fsPm0F0k2/track`,
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

      this.locations.subscribe(locations => {
        this.updateMap(locations);
      });
    });
  }

  updateMap(locations) {
    this.markers.map(maker => maker.setMap(null));
    this.markers = [];

    const flightPath = new google.maps.Polyline({
      path: locations,
      geodesic: true,
      strokeColor: '#000080',
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    this.centerMap(locations);
    this.getDistance(locations);
    flightPath.setMap(this.map);
  }

  getDistance(locations) {
    const oldestLocation = locations.reduce((r, o) => o.timestamp < r.timestamp ? o : r);
    const recentLocation = locations.reduce((r, o) => o.timestamp > r.timestamp ? o : r);

    this.markerA = new google.maps.Marker({
        position: {
            lat: oldestLocation.lat,
            lng: oldestLocation.lng
        },
        map: this.map,
        title: 'Marker A'
    });

    this.markerB = new google.maps.Marker({
      position: {
          lat: recentLocation.lat,
          lng: recentLocation.lng
      },
      map: this.map,
      title: 'Marker B'
    });

    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
      this.markerA.getPosition(),
      this.markerB.getPosition()
    );

    this.distanceInMeters = distanceInMeters.toFixed() / 1000;
  }

  centerMap(locations) {
    const bounds = new google.maps.LatLngBounds();

    if (bounds) {
      for (const u in locations) {
        let marker = new google.maps.Marker({
          position: new google.maps.LatLng(locations[u].lat,
          locations[u].lng),
        });

        bounds.extend(marker.getPosition());
      }

      this.map.fitBounds(bounds);
    }
  }

  startTracking() {
    this.isTracking = true;

    this.run(this.chronometer, 2);
    this.watch = Geolocation.watchPosition({}, (position, err) => {
      if (position) {
        this.addNewLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.timestamp
        );
      }
    });
  }

  stopTracking() {
    this.run(this.chronometer, 2);

    Geolocation.clearWatch({ id: this.watch }).then(() => {
      this.isTracking = false;
      this.run(this.chronometer, 1);
    });
  }

  addNewLocation(lat, lng, timestamp) {
    this.locationsCollection.add({
      lat,
      lng,
      timestamp,
    });

    const position = new google.maps.LatLng(lat, lng);
    this.map.setCenter(position);
    this.map.setZoom(5);
  }

  deleteLocation(pos) {
    this.locationsCollection.doc(pos.id).delete();
  }

  run(chronometer: Chronometer, status: StatusChonometer) {
    chronometer.status = status;
    switch (chronometer.status) {
    case StatusChonometer.pause:
        chronometer.pause();
        break;
    case StatusChonometer.restart:
        chronometer.restart();
        break;
    case StatusChonometer.start:
        chronometer.start();
        break;
    default:
        break;
    }
  }
}
