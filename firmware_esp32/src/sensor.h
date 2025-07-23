// sensor.h
// ========================================

#ifndef SENSOR_H
#define SENSOR_H

#include <DHT.h>

class Sensor {
private:
  static DHT dht;
  static bool dhtInitialized;
  
  // Cache del tipo de sensor para evitar lecturas repetidas de flash
  static String cachedSensorType;
  
  // PIR variables para lectura continua
  static bool motionDetectedInInterval;
  static unsigned long lastMotionTime;
  static bool pirStabilized;
  static unsigned long pirInitTime;
  static bool ledState;
  static unsigned long ledOffTime;
  
  static String formatDHT22Reading();
  static String formatMQ4Reading();
  static String formatPIRReading();
  
public:
  static void init();
  static String readAndFormat();
  static void checkPIRContinuously();  // Nueva función para PIR
  static bool isPIRStabilized();       // Verificar si PIR está listo
};

#endif