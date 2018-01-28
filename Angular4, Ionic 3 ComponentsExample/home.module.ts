import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {ChildEditContentPage, ChildModal2ContentPage, ChildModalContentPage, HomePage} from './home';


@NgModule({
  declarations: [
    HomePage,
    ChildModalContentPage,
    ChildModal2ContentPage,
    ChildEditContentPage
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
    IonicPageModule.forChild(ChildModalContentPage),
    IonicPageModule.forChild(ChildModal2ContentPage),
    IonicPageModule.forChild(ChildEditContentPage),
  ],
})
export class HomePageModule {
}
