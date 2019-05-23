#include <ESP8266WiFi.h>
#include <FirebaseArduino.h>
 
#define lightPin 16
#define fanPin 5
#define lightBrightnessPin 4
 
// Set these to run example.
#define FIREBASE_HOST "homeautomation-43eba.firebaseio.com"
#define FIREBASE_AUTH "3TMYzghU6lYhptIyKIZ4GI1e69MA97y8zza0XkRl"
#define WIFI_SSID "SICT"
#define WIFI_PASSWORD ""
 
void setup() {
  pinMode(lightPin, OUTPUT);
  pinMode(fanPin, OUTPUT);
  Serial.begin(115200);
  // connect to wifi.
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println("connecting");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("connected: ") ;
  Serial.println(WiFi.localIP());
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.stream("/");
//  Firebase.stream("/fan");
}
void loop() {
  if (Firebase.failed()) {
    Serial.println("streaming error");
    Serial.println(Firebase.error());
  }
 
  if (Firebase.available()) {
    FirebaseObject event = Firebase.readEvent();
    
    String eventType = event.getString("type");
    Serial.print("event: ");
    Serial.println(eventType);
    String path = event.getString("path");
    Serial.print("path: ");
    Serial.println(path);
    String data = event.getString("data");
    Serial.print("data: ");
    Serial.println(data);
    
    if (eventType == "put") {
      Serial.println(String("data: ") + data);
      
      if (path.startsWith("/light")) {
        path.replace("/light", "");
        if(path.equals("/status"))
          if (data.equals("on")) digitalWrite(lightPin, HIGH);
          else digitalWrite(lightPin, LOW);
        else if (path.equals("/brightness")){
          Serial.println(String("data: ") + data);
        }
        
      }else if (path.equals("/fan/status"))
        if (data.equals("on")) digitalWrite(fanPin, HIGH);
        else digitalWrite(fanPin, LOW);
    }
  }
}
