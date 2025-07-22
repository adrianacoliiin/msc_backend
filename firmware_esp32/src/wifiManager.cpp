// wifiManager.cpp
// ========================================

#include "wifiManager.h"
#include "storage.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

WebServer WiFiManager::server(80);
WiFiUDP WiFiManager::ntpUDP;
NTPClient WiFiManager::timeClient(ntpUDP, NTP_SERVER, UTC_OFFSET_SECONDS, 60000);

void WiFiManager::startSetupMode() {
  // Crear Access Point
  String apSSID = String(AP_SSID_PREFIX) + String(ESP.getEfuseMac(), HEX);
  
  Serial.println("Starting Access Point: " + apSSID);
  WiFi.softAP(apSSID.c_str(), AP_PASSWORD);
  
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);
  
  // Configurar rutas del servidor web
  server.on("/", handleRoot);
  server.on("/submit", HTTP_POST, handleSubmit);
  server.onNotFound(handleNotFound);
  
  server.begin();
  Serial.println("Web server started on http://192.168.4.1");
}

void WiFiManager::handleClient() {
  server.handleClient();
}

void WiFiManager::handleRoot() {
  String html = R"(
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Configuración Sensor Clínica</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 10px 0 0 0; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; color: #333; font-weight: bold; }
        input[type="text"], input[type="password"] { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        input[type="text"]:focus, input[type="password"]:focus { border-color: #007bff; outline: none; }
        .btn { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .info strong { color: #1976d2; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Sensor Clínica</h1>
            <p>Configuración inicial del dispositivo</p>
        </div>
        
        <div class='info'>
            <strong>Tipo de sensor:</strong> )" + String(SENSOR_TYPE) + R"(<br>
            <strong>Device ID:</strong> <span id='device-mac'>)" + String(ESP.getEfuseMac(), HEX) + R"(</span>
        </div>
        
        <form action='/submit' method='POST'>
            <div class='form-group'>
                <label for='ssid'>Red WiFi (SSID):</label>
                <input type='text' id='ssid' name='ssid' required placeholder='Nombre de la red WiFi'>
            </div>
            
            <div class='form-group'>
                <label for='password'>Contraseña WiFi:</label>
                <input type='password' id='password' name='password' required placeholder='Contraseña de la red'>
            </div>
            
            <div class='form-group'>
                <label for='token'>Token de Activación:</label>
                <input type='text' id='token' name='token' required placeholder='Token proporcionado por el administrador'>
            </div>
            
            <button type='submit' class='btn'>Configurar Dispositivo</button>
        </form>
    </div>
</body>
</html>
)";
  
  server.send(200, "text/html", html);
}

void WiFiManager::handleSubmit() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");
  String token = server.arg("token");
  
  if (ssid.length() == 0 || password.length() == 0 || token.length() == 0) {
    server.send(400, "text/html", 
      "<html><body><h2>Error: Todos los campos son requeridos</h2>"
      "<a href='/'>Volver</a></body></html>");
    return;
  }
  
  // Conectar a WiFi temporalmente para activar dispositivo
  Serial.println("Connecting to WiFi for device activation...");
  WiFi.begin(ssid.c_str(), password.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    server.send(400, "text/html", 
      "<html><body><h2>Error: No se pudo conectar al WiFi</h2>"
      "<p>Verifique el SSID y contraseña</p>"
      "<a href='/'>Volver</a></body></html>");
    return;
  }
  
  Serial.println("\nWiFi connected for activation");
  
  // Activar dispositivo en el backend
  String deviceId;
  if (!activateDevice(token, deviceId)) {
    server.send(400, "text/html", 
      "<html><body><h2>Error: No se pudo activar el dispositivo</h2>"
      "<p>Verifique el token de activación</p>"
      "<a href='/'>Volver</a></body></html>");
    return;
  }
  
  // Guardar configuración
  Storage::saveConfig(ssid, password, deviceId);
  
  // Respuesta exitosa
  server.send(200, "text/html", 
    "<html><body style='font-family: Arial; text-align: center; padding: 50px;'>"
    "<h2 style='color: green;'>✅ Dispositivo configurado exitosamente</h2>"
    "<p><strong>Device ID:</strong> " + deviceId + "</p>"
    "<p><strong>Sensor Type:</strong> " + String(SENSOR_TYPE) + "</p>"
    "<p>El dispositivo se reiniciará en modo operación...</p>"
    "</body></html>");
  
  // Reiniciar después de un delay
  delay(3000);
  ESP.restart();
}

void WiFiManager::handleNotFound() {
  server.send(404, "text/plain", "Not Found");
}

bool WiFiManager::activateDevice(const String& token, String& deviceId) {
  HTTPClient http;
  
  String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + "/api/devices/activate";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT);
  
  // Crear JSON payload
  DynamicJsonDocument doc(1024);
  doc["token"] = token;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Activating device with URL: " + url);
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Activation response: " + response);
    
    // Parsear respuesta
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"] == true) {
      deviceId = responseDoc["data"]["deviceId"].as<String>();
      http.end();
      return true;
    }
  }
  
  Serial.println("Activation failed. HTTP code: " + String(httpResponseCode));
  http.end();
  return false;
}

bool WiFiManager::connectToWiFi() {
  String ssid, password, deviceId;
  if (!Storage::loadConfig(ssid, password, deviceId)) {
    return false;
  }
  
  Serial.println("Connecting to WiFi: " + ssid);
  WiFi.begin(ssid.c_str(), password.c_str());
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startTime < WIFI_TIMEOUT)) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    return true;
  } else {
    Serial.println("\nWiFi connection failed");
    return false;
  }
}

void WiFiManager::initNTP() {
  timeClient.begin();
  timeClient.update();
  Serial.println("NTP initialized");
}

String WiFiManager::getCurrentTimestamp() {
  timeClient.update();
  unsigned long epochTime = timeClient.getEpochTime();
  
  // Convertir a formato ISO 8601
  time_t rawTime = epochTime;
  struct tm* timeInfo = gmtime(&rawTime);
  
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", timeInfo);
  
  return String(buffer);
}