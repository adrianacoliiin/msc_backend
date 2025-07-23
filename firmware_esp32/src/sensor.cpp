// sensor.cpp
// ========================================

#include "sensor.h"
#include "storage.h"
#include "wifiManager.h"
#include "config.h"
#include <ArduinoJson.h>

DHT Sensor::dht(DHT_PIN, DHT_TYPE);
bool Sensor::dhtInitialized = false;

// Cachear tipo de sensor para evitar lecturas repetidas de flash
String Sensor::cachedSensorType = "";

// PIR variables estáticas
bool Sensor::motionDetectedInInterval = false;
unsigned long Sensor::lastMotionTime = 0;
bool Sensor::pirStabilized = false;
unsigned long Sensor::pirInitTime = 0;
bool Sensor::ledState = false;
unsigned long Sensor::ledOffTime = 0;

void Sensor::init() {
  // Cachear tipo de sensor una sola vez
  cachedSensorType = Storage::getSensorType();
  
  Serial.println("Initializing sensor: " + cachedSensorType);
  
  if (cachedSensorType == "dht22") {
    dht.begin();
    dhtInitialized = true;
    Serial.println("DHT22 sensor initialized on pin " + String(DHT_PIN));
    
  } else if (cachedSensorType == "mq4") {
    pinMode(MQ4_PIN, INPUT);
    Serial.println("MQ4 sensor initialized on pin " + String(MQ4_PIN));
    
  } else if (cachedSensorType == "pir") {
    pinMode(PIR_PIN, INPUT);
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LOW);  // LED apagado inicialmente
    
    pirInitTime = millis();
    pirStabilized = false;
    motionDetectedInInterval = false;
    ledState = false;
    
    Serial.println("PIR sensor initialized on pin " + String(PIR_PIN));
    Serial.println("LED debug on pin " + String(LED_BUILTIN));
    Serial.println("PIR stabilization period: " + String(PIR_STABILIZATION_TIME/1000) + " seconds");
    Serial.println("Please wait without moving for stabilization...");
  }
}

bool Sensor::isPIRStabilized() {
  if (cachedSensorType != "pir") return true;
  
  if (!pirStabilized) {
    unsigned long elapsed = millis() - pirInitTime;
    if (elapsed >= PIR_STABILIZATION_TIME) {
      pirStabilized = true;
      Serial.println("✅ PIR sensor stabilized and ready!");
      // Parpadear LED 3 veces para indicar que está listo
      for (int i = 0; i < 3; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(200);
        digitalWrite(LED_BUILTIN, LOW);
        delay(200);
      }
    } else {
      // Mostrar progreso cada 10 segundos
      static unsigned long lastProgress = 0;
      if (millis() - lastProgress > 10000) {
        int remaining = (PIR_STABILIZATION_TIME - elapsed) / 1000;
        Serial.println("PIR stabilizing... " + String(remaining) + " seconds remaining");
        lastProgress = millis();
      }
    }
  }
  
  return pirStabilized;
}

void Sensor::checkPIRContinuously() {
  if (cachedSensorType != "pir") return;
  
  // No leer hasta que esté estabilizado
  if (!isPIRStabilized()) return;
  
  bool currentReading = digitalRead(PIR_PIN) == HIGH;
  
  // Si detecta movimiento
  if (currentReading) {
    if (!motionDetectedInInterval) {
      // Primera detección en este intervalo
      Serial.println("MOTION DETECTED! Time: " + String(millis()));
      motionDetectedInInterval = true;
    }
    lastMotionTime = millis();
    
    // Encender LED
    if (!ledState) {
      digitalWrite(LED_BUILTIN, HIGH);
      ledState = true;
      Serial.println("LED ON - Motion detected");
    }
    
    // Extender tiempo de LED encendido
    ledOffTime = millis() + PIR_LED_DURATION;
  }
  
  // Manejar apagado del LED
  if (ledState && millis() >= ledOffTime) {
    digitalWrite(LED_BUILTIN, LOW);
    ledState = false;
    Serial.println("LED OFF - No motion for " + String(PIR_LED_DURATION/1000) + " seconds");
  }
  
  // Debug cada 30 segundos si no hay movimiento
  static unsigned long lastDebug = 0;
  if (!motionDetectedInInterval && millis() - lastDebug > 30000) {
    Serial.println("PIR active - No motion detected in last 30 seconds");
    lastDebug = millis();
  }
}

String Sensor::readAndFormat() {
  if (cachedSensorType == "dht22") {
    return formatDHT22Reading();
  } else if (cachedSensorType == "mq4") {
    return formatMQ4Reading();
  } else if (cachedSensorType == "pir") {
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
  tempReading["value"] = round(temperature * 10) / 10.0;
  tempReading["timestamp"] = timestamp;
  
  JsonObject humReading = readings.createNestedObject();
  humReading["metric"] = "humidity";
  humReading["value"] = round(humidity * 10) / 10.0;
  humReading["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("DHT22 Reading - Temp: " + String(temperature) + "°C, Humidity: " + String(humidity) + "%");
  
  return jsonString;
}

String Sensor::formatMQ4Reading() {
  int rawValue = analogRead(MQ4_PIN);
  float gasLevel = (rawValue / 4095.0) * 1000.0;
  
  String timestamp = WiFiManager::getCurrentTimestamp();
  
  DynamicJsonDocument doc(1024);
  doc["sensorType"] = "mq4";
  
  JsonArray readings = doc.createNestedArray("readings");
  
  JsonObject gasReading = readings.createNestedObject();
  gasReading["metric"] = "gas";
  gasReading["value"] = round(gasLevel * 10) / 10.0;
  gasReading["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("MQ4 Reading - Gas: " + String(gasLevel) + " ppm (raw: " + String(rawValue) + ")");
  
  return jsonString;
}

String Sensor::formatPIRReading() {
  if (!isPIRStabilized()) {
    Serial.println("PIR not stabilized yet, skipping reading");
    return "";
  }
  
  // Usar el flag acumulado del intervalo, no lectura instantánea
  bool motionInLastMinute = motionDetectedInInterval;
  
  String timestamp = WiFiManager::getCurrentTimestamp();
  
  DynamicJsonDocument doc(1024);
  doc["sensorType"] = "pir";
  
  JsonArray readings = doc.createNestedArray("readings");
  
  JsonObject motionReading = readings.createNestedObject();
  motionReading["metric"] = "motion";
  motionReading["value"] = motionInLastMinute;
  motionReading["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("PIR Reading - Motion in last minute: " + String(motionInLastMinute ? "YES" : "NO"));
  if (motionInLastMinute) {
    Serial.println("   Last motion detected at: " + String(lastMotionTime));
  }
  
  // Reset del flag para el siguiente intervalo
  motionDetectedInInterval = false;
  
  return jsonString;
}