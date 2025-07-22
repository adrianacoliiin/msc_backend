// storage.cpp
// ========================================

#include "storage.h"
#include "config.h"

Preferences Storage::prefs;

void Storage::init() {
  prefs.begin("device_config", false);
}

bool Storage::hasConfig() {
  return prefs.isKey("ssid") && prefs.isKey("password") && prefs.isKey("deviceId");
}

void Storage::saveConfig(const String& ssid, const String& password, const String& deviceId) {
  prefs.putString("ssid", ssid);
  prefs.putString("password", password);
  prefs.putString("deviceId", deviceId);
  prefs.putString("sensorType", SENSOR_TYPE);
  
  Serial.println("Configuration saved to flash");
  Serial.println("SSID: " + ssid);
  Serial.println("Device ID: " + deviceId);
  Serial.println("Sensor Type: " + String(SENSOR_TYPE));
}

bool Storage::loadConfig(String& ssid, String& password, String& deviceId) {
  if (!hasConfig()) {
    return false;
  }
  
  ssid = prefs.getString("ssid", "");
  password = prefs.getString("password", "");
  deviceId = prefs.getString("deviceId", "");
  
  return true;
}

void Storage::clearConfig() {
  prefs.clear();
  Serial.println("Configuration cleared from flash");
}

String Storage::getSensorType() {
  return prefs.getString("sensorType", SENSOR_TYPE);
}