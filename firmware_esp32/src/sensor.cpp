// sensor.cpp
// ========================================

#include "sensor.h"
#include "storage.h"
#include "wifiManager.h"
#include "config.h"
#include <ArduinoJson.h>

DHT Sensor::dht(DHT_PIN, DHT_TYPE);
bool Sensor::dhtInitialized = false;

void Sensor::init() {
  String sensorType = Storage::getSensorType();
  
  Serial.println("Initializing sensor: " + sensorType);
  
  if (sensorType == "dht22") {
    dht.begin();
    dhtInitialized = true;
    Serial.println("DHT22 sensor initialized on pin " + String(DHT_PIN));
  } else if (sensorType == "mq4") {
    pinMode(MQ4_PIN, INPUT);
    Serial.println("MQ4 sensor initialized on pin " + String(MQ4_PIN));
  } else if (sensorType == "pir") {
    pinMode(PIR_PIN, INPUT);
    Serial.println("PIR sensor initialized on pin " + String(PIR_PIN));
  }
}

String Sensor::readAndFormat() {
  String sensorType = Storage::getSensorType();
  
  if (sensorType == "dht22") {
    return formatDHT22Reading();
  } else if (sensorType == "mq4") {
    return formatMQ4Reading();
  } else if (sensorType == "pir") {
    return formatPIRReading();
  }
  
  return "";
}

String Sensor::formatDHT22Reading() {
  if (!dhtInitialized) {
    Serial.println("DHT22 not initialized");
    return "";
  }
  
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT22 sensor");
    return "";
  }
  
  String timestamp = WiFiManager::getCurrentTimestamp();
  
  DynamicJsonDocument doc(1024);
  doc["sensorType"] = "dht22";
  
  JsonArray readings = doc.createNestedArray("readings");
  
  JsonObject tempReading = readings.createNestedObject();
  tempReading["metric"] = "temperature";
  tempReading["value"] = round(temperature * 10) / 10.0; // 1 decimal
  tempReading["timestamp"] = timestamp;
  
  JsonObject humReading = readings.createNestedObject();
  humReading["metric"] = "humidity";
  humReading["value"] = round(humidity * 10) / 10.0; // 1 decimal
  humReading["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("DHT22 Reading - Temp: " + String(temperature) + "°C, Humidity: " + String(humidity) + "%");
  
  return jsonString;
}

String Sensor::formatMQ4Reading() {
  int rawValue = analogRead(MQ4_PIN);
  float gasLevel = (rawValue / 4095.0) * 1000.0; // Convertir a ppm aproximado
  
  String timestamp = WiFiManager::getCurrentTimestamp();
  
  DynamicJsonDocument doc(1024);
  doc["sensorType"] = "mq4";
  
  JsonArray readings = doc.createNestedArray("readings");
  
  JsonObject gasReading = readings.createNestedObject();
  gasReading["metric"] = "gas";
  gasReading["value"] = round(gasLevel * 10) / 10.0; // 1 decimal
  gasReading["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("MQ4 Reading - Gas: " + String(gasLevel) + " ppm (raw: " + String(rawValue) + ")");
  
  return jsonString;
}

String Sensor::formatPIRReading() {
  bool motionDetected = digitalRead(PIR_PIN) == HIGH;
  
  String timestamp = WiFiManager::getCurrentTimestamp();
  
  DynamicJsonDocument doc(1024);
  doc["sensorType"] = "pir";
  
  JsonArray readings = doc.createNestedArray("readings");
  
  JsonObject motionReading = readings.createNestedObject();
  motionReading["metric"] = "motion";
  motionReading["value"] = motionDetected;
  motionReading["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("PIR Reading - Motion: " + String(motionDetected ? "detected" : "not detected"));
  
  return jsonString;
}
