// mqttClient.cpp
// ========================================

#include "mqttClient.h"
#include "storage.h"
#include "config.h"

WiFiClient MQTTClient::wifiClient;
PubSubClient MQTTClient::mqttClient(wifiClient);
String MQTTClient::deviceId;
String MQTTClient::mqttTopic;

void MQTTClient::init() {
  // Cargar device ID
  String ssid, password;
  Storage::loadConfig(ssid, password, deviceId);
  
  // Construir topic
  mqttTopic = "devices/" + deviceId + "/sensors";
  
  // Configurar servidor MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  
  Serial.println("MQTT initialized");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Topic: " + mqttTopic);
  Serial.println("MQTT Host: " + String(MQTT_HOST) + ":" + String(MQTT_PORT));
  Serial.println("MQTT Username: " + String(MQTT_USERNAME)); // ← Agregado para debugging
}

bool MQTTClient::connect() {
  if (mqttClient.connected()) {
    return true;
  }
  
  Serial.print("Connecting to MQTT broker...");
  Serial.println("Host: " + String(MQTT_HOST) + ":" + String(MQTT_PORT));
  Serial.println("Username: " + String(MQTT_USERNAME));
  Serial.println("Password: " + String(MQTT_PASSWORD).substring(0, 4) + "****"); // Solo mostrar los primeros 4 caracteres
  
  String clientId = "ESP32_" + deviceId;
  Serial.println("Client ID: " + clientId);
  
  unsigned long startTime = millis();
  while (!mqttClient.connected() && (millis() - startTime < MQTT_TIMEOUT)) {
    // Conectar con usuario y contraseña
    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println(" connected!");
      return true;
    } else {
      Serial.print(".");
      delay(500);
    }
  }
  
  Serial.println(" failed!");
  Serial.println("MQTT State: " + String(mqttClient.state()));
  Serial.println("MQTT Error codes: -4=timeout, -3=connection lost, -2=connect failed, -1=disconnected, 0=connected, 1=protocol error, 2=id rejected, 3=server unavailable, 4=bad credentials, 5=unauthorized");
  
  // Agregar más información de debugging específica para el error 4
  if (mqttClient.state() == 4) {
    Serial.println("ERROR 4 (bad credentials) - Verify:");
    Serial.println("  Username format should be: user:vhost");
    Serial.println("  Current username: " + String(MQTT_USERNAME));
    Serial.println("  Password length: " + String(strlen(MQTT_PASSWORD)));
  }
  
  return false;
}

bool MQTTClient::isConnected() {
  return mqttClient.connected();
}

void MQTTClient::loop() {
  mqttClient.loop();
}

void MQTTClient::publishSensorData(const String& jsonPayload) {
  if (!mqttClient.connected()) {
    Serial.println("MQTT not connected. Attempting reconnection...");
    if (!connect()) {
      Serial.println("Failed to reconnect to MQTT. Data not published.");
      return;
    }
  }
  
  bool published = mqttClient.publish(mqttTopic.c_str(), jsonPayload.c_str());
  
  if (published) {
    Serial.println("Data published to MQTT");
    Serial.println("Topic: " + mqttTopic);
    Serial.println("Payload: " + jsonPayload);
  } else {
    Serial.println("Failed to publish data to MQTT");
  }
}