// wifiManager.h
// ========================================

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>
#include <WebServer.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

class WiFiManager {
private:
  static WebServer server;
  static WiFiUDP ntpUDP;
  static NTPClient timeClient;
  
  static void handleRoot();
  static void handleSubmit();
  static void handleNotFound();
  static bool activateDevice(const String& token, String& deviceId);
  
public:
  static void startSetupMode();
  static void handleClient();
  static bool connectToWiFi();
  static void initNTP();
  static String getCurrentTimestamp();
};

#endif