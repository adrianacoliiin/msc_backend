// sensor.h
// ========================================

#ifndef SENSOR_H
#define SENSOR_H

#include <DHT.h>

class Sensor {
private:
  static DHT dht;
  static bool dhtInitialized;
  
  static String formatDHT22Reading();
  static String formatMQ4Reading();
  static String formatPIRReading();
  
public:
  static void init();
  static String readAndFormat();
};

#endif