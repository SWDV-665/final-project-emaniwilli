import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})

export class PhotoService {
  //initializing array of photos for reference of captured photos
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';
  private platform: Platform

  constructor(platform:Platform) {
    this.platform = platform
   }
   //photo object passed to represent newly captured photo
    private async savePicture(photo: Photo) {
      //converting pic to base64 -- requirement to save
    const base64Data = await this.readAsBase64(photo);

    //write file to data directory
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    }
    else {
      // Use webPath to display the new image instead of base64 since it's already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };
    }
  }

   private async readAsBase64(photo: Photo) {

    // "hybrid" will detect Cordova or Capacitor
  if (this.platform.is('hybrid')) {
    // Read the file into base64 format
    const file = await Filesystem.readFile({
      path: photo.path!
    });

    return file.data;
  }
  else {
    // Fetch the photo -- convert to base64 format
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }
}
  
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });


  public async addNewToGallery() {
    // adding photo to the beginning of photo array
    const capturedPhoto = await Camera.getPhoto({ //taking photo
      resultType: CameraResultType.Uri, //file based data
      source: CameraSource.Camera, //takes new photo
      quality: 100 // quality
    });
    this.photos.unshift({
      filepath: "soon...",
      webviewPath: capturedPhoto.webPath!
    });

    //save pic and add to collection
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    //Saves the photo array -- stored every time a photo is taken
    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  public async loadSaved() {
   // Retrieves photo array data
  const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
  this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

  if (!this.platform.is('hybrid')) {
    // Display the photo by reading into base64 format
    for (let photo of this.photos) {
      // Read data for each saved photo
      const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
      });

      // Web platform only: Load the photo as base64 data
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }
}
public async deletePicture(photo: UserPhoto, position: number) {
  // Remove  photo from the Photos reference data array
  this.photos.splice(position, 1);

  // Update photos array cache by overwriting the existing photo array
  Preferences.set({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.photos)
  });

  // delete photo file from filesystem
  const filename = photo.filepath
                      .substr(photo.filepath.lastIndexOf('/') + 1);

  await Filesystem.deleteFile({
    path: filename,
    directory: Directory.Data
  });
}

public async sharePicture(photo: UserPhoto, position: number) {
  navigator.share({
    'title':'Photo',
    'text':'View my photo!',
    'url':'http://localhost:8100'
  })
}
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
