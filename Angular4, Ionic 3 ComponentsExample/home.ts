import {Component, ViewChild} from '@angular/core';
import {Crop} from '@ionic-native/crop';
import {
  IonicPage, NavController, NavParams, ViewController, Platform, AlertController, LoadingController
} from 'ionic-angular';
import {LocalDbProvider} from '../../providers/local-db/local-db';
import {ModalController, Slides} from 'ionic-angular';
import {Camera} from '@ionic-native/camera';
import {ChildService} from '../../providers/child-service/child-service';
import {ActionSheetController} from "ionic-angular";
import {SettingsPage} from "../settings/settings";
import {AuthService} from '../../providers/auth-service/auth-service';
import {Badge} from '@ionic-native/badge';
import {UserService} from "../../providers/user-service/user.service";
import {SocketService} from "../../services/socket";
import {StatusBar} from '@ionic-native/status-bar';
import {Child} from "../../providers/auth-service/child.model";
import {User} from "../../providers/auth-service/user.model";

/**
 * Home View - Start view after login
 * CRUD children, get child details, pick child for milestones
 *
 * @author Nils Widal
 * @version 0.0.1
 */

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  childs: any = [];
  user;
  loadingChilds;

  //theChild;
  constructor(public modalCtrl: ModalController, private badge: Badge, private statusBar: StatusBar,
              private alertCtrl: AlertController, public navCtrl: NavController, private loadingCtrl: LoadingController,
              private localDB: LocalDbProvider, private childService: ChildService) {
  }

  // Before Rendering goes here
  ionViewDidLoad() {
    this.statusBar.overlaysWebView(true);
    this.statusBar.backgroundColorByHexString('#6DA4A8');
    this.statusBar.show();
    /*TODO set/update badge for new milestones from external users on entering view*/
    this.localDB.getUserData().subscribe(data => {
      if (data) {
        this.user = data;
        this.getChilds();
      }
    });
  }

  /* MODALS - Create Child 1, 2; Edit Child*/
  openCreateChildModal() {
    let modal = this.modalCtrl.create(ChildModalContentPage);
    modal.onDidDismiss(child => {
      if (child) {
        !child.imageUrl ? child.imageUrl = 'assets/images/sample-baby.PNG' : null;
        this.addChild(child);
        this.openCreateChild2Modal(child);
      }
    });
    modal.present();
  }

  openCreateChild2Modal(child) {
    let modal = this.modalCtrl.create(ChildModal2ContentPage, {child: child});
    modal.onDidDismiss(child => {
      if (child) {
        !child.imageUrl ? child.imageUrl = 'assets/images/sample-baby.PNG' : null;
        this.updateChild(child);
      }
    });
    modal.present();
  }

  openEditChildModal(child) {
    let modal = this.modalCtrl.create(ChildEditContentPage, {child: child});
    modal.onDidDismiss(child => {
      if (child) {
        !child.imageUrl ? child.imageUrl = 'assets/images/sample-baby.PNG' : null;
        this.updateChild(child);
      }
    });
    modal.present();
  }


  /* Navigates*/
  goToChild(no) {
    this.childService.setChild(this.childs[no]);
    this.navCtrl.parent.select(1);
  }

  openSettings() {
    this.navCtrl.push(SettingsPage);
  }

  /* CRUD CHILD */
  getChilds() {
    this.localDB.getChilds().subscribe(val => {
      if (val) {
        this.childs = val;
        this.childService.setChild(this.childs[0]);
      } else {
        this.showLoading();
        console.log("show loading");
      }
      this.childService.getChildren(this.user.id).then(data => {
        if (data) {
          this.childs = data;
          this.localDB.setChilds(this.childs);
          this.childService.setChild(this.childs[0]);
          console.log("dismiss");
          this.loadingChilds ? this.loadingChilds.dismiss() : null;
        }
      });
    });
  }

  addChild(c) {
    this.childService.addChild(c).then(data => {
      this.childs.push(data);
      this.localDB.setChilds(this.childs);
    });
  }

  updateChild(c) {
    var i = this.childs.findIndex(x => x.id == c.id);
    if (i >= 0) {
      this.childs[i] = c;
    }
    this.localDB.setChilds(this.childs);
    this.childService.updateChild(c).then(data => {
    }, err => {
      console.log(err);
    })
  }

  deleteChild(c) {
    for (let i = 0; i < this.childs.length; i++) {
      if (c.firstname === this.childs[i].firstname && c.lastname === this.childs[i].lastname) {
        this.childs.splice(i, 1)
      }
    }
    this.childService.deleteChild(c).then(data => {
      this.localDB.setChilds(this.childs);
    }, err => {
      console.log(err);
    });
  }

  // Popover Messages
  showPopup(title, text) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: text,
      buttons: [
        {
          text: 'OK',
          handler: data => {
          }
        }
      ]
    });
  }

  showLoading() {
    this.loadingChilds = this.loadingCtrl.create({
      content: 'Kinder abholen...',
      duration: 60000
    });
    this.loadingChilds.present();
  }
}

@Component({
  selector: 'page-new-child',
  templateUrl: 'child-create.modal.html'
})
export class ChildModalContentPage {
  @ViewChild(Slides) slides: Slides;
  child : Child;
  user: User;

  constructor(public platform: Platform, public params: NavParams, private actionSheetCtrl: ActionSheetController,
              public viewCtrl: ViewController, private localDB: LocalDbProvider,
              private camera: Camera, private socket: SocketService) {
    this.localDB.getUserData().subscribe(data => {
      if (data) {
        this.user = data;
        this.child.lastname = data.lastname;
      }
    });
  }

  saveChild() {
    if (this.user.childNo)
      this.user.childNo += 1;
    else this.user.childNo = 1;

    this.updateUser(this.user);

    this.child.users = [this.user.id];
    this.child.id = this.user.email + "_" + this.user.childNo;

    this.localDB.setUserData(this.user);

    this.viewCtrl.dismiss(this.child);
  }

  public updateUser(user) {
    this.socket.emit('update_user', user);
  }

  /*Photo options*/
  public options: any = {
    allowEdit: true,
    sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
    targetWidth: 600,
    targetHeight: 600,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    destinationType: this.camera.DestinationType.DATA_URL,
    saveToPhotoAlbum: false
  };

  takePicture(no) {
    if (no == 2) {
      this.options.sourceType = this.camera.PictureSourceType.PHOTOLIBRARY;
    } else {
      this.options.sourceType = this.camera.PictureSourceType.CAMERA;
    }
    // Get Image from ionic-native's built in camera plugin
    this.camera.getPicture(this.options)
      .then((img) => {
        this.child.imageUrl = "data:image/jpeg;base64," + img;
        // Crop Image, on android this returns something like, '/storage/emulated/0/Android/...'
        // Only giving an android example as ionic-native camera has built in cropping ability
        if (this.platform.is('ios')) {
          return img;
        } else if (this.platform.is('android')) {
          return img;
        }
      });
  }

  presentActionSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Quelle auswählen',
      buttons: [
        {
          text: 'Kamera starten',
          icon: 'camera',
          role: 'destructive',
          handler: () => {
            this.takePicture(1);
          }
        }, {
          text: 'Foto von Galerie',
          icon: 'images',
          handler: () => {
            this.takePicture(2);
          }
        }, {
          text: 'Abbrechen',
          role: 'cancel',
          handler: () => {
          }
        }
      ]
    });
    actionSheet.present();
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}

@Component({
  selector: 'page-new-child-2',
  templateUrl: 'child-create-2.modal.html'
})
export class ChildModal2ContentPage {
  child: Child;

  constructor(public platform: Platform, public params: NavParams,
              public viewCtrl: ViewController) {
    this.child = params.get('child');
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  saveChild() {
    this.viewCtrl.dismiss(this.child);
  }
}

@Component({
  selector: 'page-edit-child',
  templateUrl: 'child-edit.html'
})
export class ChildEditContentPage {
  child: Child;
  milestones;
  stillToDo = 12;
  memories = "Erinnerungen";
  memoryCount = 0;

  constructor(public platform: Platform, public params: NavParams, private cs: ChildService,
              public viewCtrl: ViewController, private auth: AuthService) {

    this.child = params.get('child');

    if (this.child.milestones) {
      this.stillToDo = 12 - this.child.milestones.length % 12;
      this.memoryCount = this.child.milestones.length;
      if (this.stillToDo == 1) {
        this.memories = "Erinnerung";
      }
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  saveChild() {
    this.viewCtrl.dismiss(this.child);
  }
}
