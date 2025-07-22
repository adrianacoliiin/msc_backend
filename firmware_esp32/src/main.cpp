// main.cpp (o main.ino si usas Arduino IDE)
// ========================================

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <DHT.h>

// Includes de módulos propios
#include "config.h"
#include "storage.h"
#include "wifiManager.h"
#include "mqttClient.h"
#include "sensor.h"

// Variables globales
bool configMode = false;
unsigned long lastSensorReading = 0;
const unsigned long SENSOR_INTERVAL = 60000; // 1 minuto
const int RESET_BUTTON_PIN = 0; // GPIO0 (BOOT button)
unsigned long buttonPressTime = 0;
bool buttonPressed = false;

// === Prototipos de funciones ===
void startOperationMode();
void handleOperationMode();
void readAndPublishSensor();
void checkResetButton();


void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== ESP32 Sensor Device Starting ===");
  
  // Inicializar pin del botón de reset
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);
  
  // Inicializar storage
  Storage::init();
  
  // Inicializar sensor
  Sensor::init();
  
  // Verificar si hay configuración guardada
  if (!Storage::hasConfig()) {
    Serial.println("No configuration found. Starting setup mode...");
    configMode = true;
    WiFiManager::startSetupMode();
  } else {
    Serial.println("Configuration found. Starting operation mode...");
    configMode = false;
    startOperationMode();
  }
}

void loop() {
  // Verificar botón de reset
  checkResetButton();
  
  if (configMode) {
    // Modo configuración: manejar servidor web
    WiFiManager::handleClient();
  } else {
    // Modo operación
    handleOperationMode();
  }
  
  delay(100);
}

void startOperationMode() {
  // Conectar a WiFi
  if (!WiFiManager::connectToWiFi()) {
    Serial.println("Failed to connect to WiFi. Restarting setup mode...");
    Storage::clearConfig();
    ESP.restart();
    return;
  }
  
  // Inicializar NTP
  WiFiManager::initNTP();
  
  // Conectar a MQTT
  MQTTClient::init();
  if (!MQTTClient::connect()) {
    Serial.println("Failed to connect to MQTT. Will retry...");
  }
}

void handleOperationMode() {
  // Mantener conexión MQTT
  if (!MQTTClient::isConnected()) {
    MQTTClient::connect();
  }
  MQTTClient::loop();
  
  // Leer sensor periódicamente
  unsigned long currentTime = millis();
  if (currentTime - lastSensorReading >= SENSOR_INTERVAL) {
    readAndPublishSensor();
    lastSensorReading = currentTime;
  }
  
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Attempting reconnection...");
    WiFiManager::connectToWiFi();
  }
}

void readAndPublishSensor() {
  Serial.println("Reading sensor data...");
  
  String jsonPayload = Sensor::readAndFormat();
  if (jsonPayload.length() > 0) {
    MQTTClient::publishSensorData(jsonPayload);
    Serial.println("Sensor data published: " + jsonPayload);
  } else {
    Serial.println("Failed to read sensor data");
  }
}

void checkResetButton() {
  bool currentState = digitalRead(RESET_BUTTON_PIN) == LOW;
  
  if (currentState && !buttonPressed) {
    // Botón presionado
    buttonPressed = true;
    buttonPressTime = millis();
    Serial.println("Reset button pressed...");
  } else if (!currentState && buttonPressed) {
    // Botón liberado
    buttonPressed = false;
    Serial.println("Reset button released");
  } else if (buttonPressed && (millis() - buttonPressTime > 5000)) {
    // Botón mantenido por más de 5 segundos
    Serial.println("Reset button held for 5+ seconds. Clearing configuration...");
    Storage::clearConfig();
    ESP.restart();
  }
}