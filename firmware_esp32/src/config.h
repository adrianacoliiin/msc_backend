// config.h
// ========================================

#ifndef CONFIG_H
#define CONFIG_H

// Configuración del sensor (cambiar según el dispositivo)
#define SENSOR_TYPE "dht22"  // Opciones: "dht22", "mq4", "pir"

// Pines de sensores
#define DHT_PIN 2
#define DHT_TYPE DHT22
#define MQ4_PIN 35
#define PIR_PIN 15  // GPIO2 para PIR

// Pin del LED integrado para debug
#define LED_BUILTIN 2  // En ESP32 DevKit es GPIO2, en otros puede ser GPIO33

// Configuración de red
#define AP_SSID_PREFIX "Clinica-Setup-"
#define AP_PASSWORD "12345678"

// Backend local (devices-service)
#define BACKEND_HOST "192.168.100.34"  // IP de devices-service
#define BACKEND_PORT 3003  // Puerto del devices-service

// MQTT en CloudAMQP
#define MQTT_HOST "crow.rmq.cloudamqp.com"
#define MQTT_PORT 1883
#define MQTT_USERNAME "xqeeyahu:xqeeyahu"  // Corregido: formato usuario:vhost
#define MQTT_PASSWORD "6YLK3yxPzxY-8XVxtCtVVkkdpup0Eq45"

// NTP
#define NTP_SERVER "pool.ntp.org"
#define UTC_OFFSET_SECONDS 0

// Timeouts
#define WIFI_TIMEOUT 10000
#define HTTP_TIMEOUT 5000
#define MQTT_TIMEOUT 5000

// PIR Configuration
#define PIR_STABILIZATION_TIME 120000  // 2 minutos en milisegundos
#define PIR_LED_DURATION 3000           // 3 segundos que permanece encendido el LED

#endif