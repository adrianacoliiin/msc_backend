// storage.h
// ========================================

#ifndef STORAGE_H
#define STORAGE_H

#include <Preferences.h>

class Storage {
private:
  static Preferences prefs;
  
public:
  static void init();
  static bool hasConfig();
  static void saveConfig(const String& ssid, const String& password, const String& deviceId);
  static bool loadConfig(String& ssid, String& password, String& deviceId);
  static void clearConfig();
  static String getSensorType();
};

#endif