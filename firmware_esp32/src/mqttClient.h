// mqttClient.h
// ========================================

#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <PubSubClient.h>
#include <WiFi.h>

class MQTTClient {
private:
  static WiFiClient wifiClient;
  static PubSubClient mqttClient;
  static String deviceId;
  static String mqttTopic;
  
public:
  static void init();
  static bool connect();
  static bool isConnected();
  static void loop();
  static void publishSensorData(const String& jsonPayload);
};

#endif
