// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
const brightnessMin = 0, brightnessMax = 100;

admin.initializeApp({
credential: admin.credential.applicationDefault(),
databaseURL: 'https://homeautomation-43eba.firebaseio.com/'
});

const {   
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  Carousel,
  Image,
  LinkOutSuggestion,
  List,
  MediaObject,
  Suggestions,
  SimpleResponse,
  Table } = require('actions-on-google');

  const intentSuggestions = [
    'fan on',
    'light on',
    'fan status',
    'light status'
  ];
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function setStatusDevices(status, device){
    return admin.database().ref(`/${device}/status/`).set(status)
    .then(snapshot => {
      agent.add(`OK, switching ${device} ${status}. Do you want more?`);
      // agent.add(new Suggestions('li'));
    }).catch(() => {
      agent.add(`Sorry,  I can't do it`);
    });
  }

  function getDeviceStatus(device){
    return admin.database().ref(`/${device}`).once("value")
      .then(snapshot => {
        agent.add(`The ${device} status is ` + snapshot.child("status").val() + `.`);
        // conv.ask(new Suggestions(intentSuggestions));
    }).catch(() => {
      agent.add(`Sorry,  I can't do it`);
    });
  }

  function getStatus(agent) {
    return getDeviceStatus(agent.parameters.Devices);
  }

  function control(agent) {
    return setStatusDevices(agent.parameters.Status, agent.parameters.Devices);
  }

  function checkPrecentage(number){
    return (number <= brightnessMin) ? brightnessMin : (number > brightnessMax) ? brightnessMax : number;
  }

  function setLightBrightness(number) {
    return admin.database().ref(`/light/brightness/`).set(checkPrecentage(number));
  }

  function getLightBrightnessAtFirebase(){
    return admin.database().ref(`/light`).once("value")
      .then(snapshot => parseInt(snapshot.child("brightness").val())
    );
  }

  function showLightBrightness(agent) {
    return getLightBrightnessAtFirebase().then(val => {
      agent.add(`Light brightness is ${val}`);
    });
  }

  function brightnessSetting(agent) {

    return getLightBrightnessAtFirebase().then(val => {
      const action = agent.action;
      var percentage = parseInt(agent.parameters.percentage.replace('%', ''));

      if (percentage >= brightnessMin && percentage <= brightnessMax){
        switch (action) {
          case `setbrightness`:
            break;
          case `upbrightness`:
            percentage = val + percentage;
            break;
          case `downbrightness`:
            percentage = val - percentage;
            break;
        }
        console.log(percentage);
        percentage = checkPrecentage(percentage);
        setLightBrightness(percentage);
        agent.add(`Ok! The brightness of the light is ${percentage}%`);

        console.log(percentage);
      } else {
        agent.add(`The brightness of the light must be between 0 to 100%`);
      }
    }).catch(() => {
      agent.add(`Sorry,  I can't do it`);
    });

  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Devices_Control', control);
  intentMap.set('Fan.switch.off - yes', control);
  intentMap.set('Fan.switch.on - yes', control);
  intentMap.set('light.switch.off - yes', control);
  intentMap.set('light.switch.on - yes', control);
  intentMap.set('devices.status.get', getStatus);
  intentMap.set('light.brightness.set', brightnessSetting);
  intentMap.set('light.brightness.down', brightnessSetting);
  intentMap.set('light.brightness.up', brightnessSetting);
  intentMap.set('light.brightness.get', showLightBrightness);

  agent.handleRequest(intentMap);
});