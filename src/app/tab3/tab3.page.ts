import { Component } from '@angular/core';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { ActionSheetController } from '@ionic/angular';
import { NavController } from '@ionic/angular'

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  constructor(public photoService: PhotoService,
              public actionSheetController: ActionSheetController) {}


  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  //photos will be displayed on screen
  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  //delete and cancel functions
  public async showActionSheet(photo: UserPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      }, {
        text: 'Share',
        role: 'Share',
        icon:'send',
        handler: () => {
          this.photoService.sharePicture(photo, position)
        }
      },
      {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {

        }
      }]
    });
    await actionSheet.present();
  }
  }
  
