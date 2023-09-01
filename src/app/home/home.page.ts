import { Component, OnInit } from '@angular/core';
import {HealthKit, HealthKitOptions} from '@awesome-cordova-plugins/health-kit/ngx';
import {Health} from '@awesome-cordova-plugins/health/ngx';
import {Platform } from '@ionic/angular';
import {Device} from '@capacitor/device';
import {
  ActivityData,
  CapacitorHealthkit,
  OtherData,
  QueryOutput,
  SampleNames,
  SleepData,
} from '@perfood/capacitor-healthkit';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{

  counter = 0;
  value!: string;
  steps!: any;
  myHeight!: any;
  myWeight!: any;
  myGender!: any;
  constructor(
    private platform: Platform,
    private health: Health,
    private healthKit: HealthKit
  ) {}

  ngOnInit() { 
    this.openHealtKit();
  }
  openHealtKit() {
    this.platform.ready().then(async () => {
      const info = await Device.getInfo();
      if (info.platform === 'android') {
        const available = await this.health.isAvailable();
        if (available) {
          // Read only permission
          const permission = [{read: ['steps']}];
          try {
            await this.health.requestAuthorization(permission);
            await this.health.promptInstallFit();
            const options = {
              startDate: new Date(), // now
              endDate: new Date(), // now
              dataType: 'steps',
              bucket: 'day'
            };
            const steps = await this.health.queryAggregated(options);
            console.log('Google Fit: ', steps);
            steps.map(step => {
              this.counter = this.counter + parseInt(step.value, 10);
            });
          } catch (e) {
            console.log({e});
          }
        }
      } else if (info.platform === 'ios') {
        const available = await this.healthKit.available();
        if (available) {
          const requestOptions: HealthKitOptions = {
            readTypes: [
              'HKQuantityTypeIdentifierHeight',
              'HKQuantityTypeIdentifierStepCount',
            ]
          };
          try {
            await this.healthKit.requestAuthorization(requestOptions);
            //Load steps
            await this.loadSteps();
          } catch (e) {
            console.error({e});
          }
        }
      }
    });
  }

  async loadSteps() {
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setMilliseconds(endDate.getMilliseconds() - 1);

    this.steps = await this.healthKit.querySampleType({
      startDate,
      endDate,
      sampleType: 'HKQuantityTypeIdentifierStepCount',
      unit: 'count'
    });

    //@ts-ignore
    this.steps.map(step => {
      this.counter = this.counter + parseInt(step.quantity, 10);
    });
  }

  async getGender() {
    this.myGender = await this.healthKit.readGender();
  }

  async getHeight() {
    const myHeight = await this.healthKit.readHeight({
      requestWritePermission: false,
      unit: 'ft'
    });
    this.myHeight = myHeight?.value.toFixed(1);
  }

  async getWeight() {
    const myWeight = await this.healthKit.readWeight({requestWritePermission: false,unit: 'kg'});
    this.myWeight = myWeight?.value.toFixed(1);
  }

  async handleRefresh(event: any) {
    await this.loadSteps();
    event.target.complete();
  }

}
