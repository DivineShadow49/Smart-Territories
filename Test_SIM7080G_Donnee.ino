#include <HardwareSerial.h>
#include "DFRobot_SHT3x.h"
#include "DFRobot_MultiGasSensor.h"
#include <DFRobot_ICP10111.h>

// Définir d'abord les adresses I2C des capteurs
#define I2C_ADDRESS_NO2  0x69
#define I2C_ADDRESS_O3   0x74

// Définir les constantes globales
#define PWRKEY 4
#define ZONE_ID "SaintAubin"
#define QOS "0"
#define zonetopic "SmartTerritories"
#define testmosquittoorg "test.mosquitto.org"

// Déclaration des objets
HardwareSerial simSerial(1); // UART1 sur l'ESP32 (TX=17, RX=16)
DFRobot_SHT3x sht3x(&Wire, /*address=*/0x45); // SHT35
DFRobot_ICP10111 icp; // ICP-10111
DFRobot_GAS_I2C gasNO2(&Wire, I2C_ADDRESS_NO2);
DFRobot_GAS_I2C gasO3(&Wire, I2C_ADDRESS_O3);

// ===== Fonctions =====

void powerOnSIM7080G() {
  pinMode(PWRKEY, OUTPUT);
  digitalWrite(PWRKEY, LOW);
  delay(1000);
  digitalWrite(PWRKEY, HIGH);
  Serial.println("SIM7080G allumé");
  delay(5000);
}

String sendATCommand(String command, int waitTime = 3000) {
  simSerial.println(command);
  Serial.println("Commande envoyée : " + command);
  delay(waitTime);

  String response = "";
  while (simSerial.available()) {
    char c = simSerial.read();
    response += c;
    Serial.write(c);
  }
  Serial.println();
  return response;
}

String getNetworkTime() {
  String response = sendATCommand("AT+CCLK?");
  if (response.indexOf("+CCLK") != -1) {
    int startIdx = response.indexOf("\"") + 1;
    int endIdx = response.indexOf("\"", startIdx);
    return response.substring(startIdx, endIdx);
  }
  return "00/00/00 00:00:00";
}

void configureSIM7080G() {
  sendATCommand("AT+CFUN=1,1");
  delay(5000);
  sendATCommand("AT");
  sendATCommand("AT+CMEE=2");
  sendATCommand("AT+CPIN?");
  sendATCommand("AT+CMNB=1");
  sendATCommand("AT+CNMP=38");
  sendATCommand("AT+CNACT=1,1");
  delay(2000);
  sendATCommand("AT+COPS=1,2,\"20801\",7");
  delay(2000);
  sendATCommand("AT+CSQ");
  sendATCommand("AT+CREG?");
  sendATCommand("AT+CGDCONT=1,\"IP\",\"bicsapn\"");
  sendATCommand("AT+CLTS=1");

  // Test de la connexion réseau
  String networkStatus = sendATCommand("AT+CGATT?");
  if (networkStatus.indexOf("+CGATT: 1") == -1) {
    Serial.println("Erreur : Pas de connexion réseau !");
    return;
  } else {
    Serial.println("Connexion réseau établie.");
  }

  // Configuration MQTT
  sendATCommand("AT+SNPING4=\"" testmosquittoorg "\",1,1,2");
  sendATCommand("AT+SMCONF=\"URL\",\"" testmosquittoorg "\",1883");
  sendATCommand("AT+SMCONF=\"QOS\",\"" QOS "\"");
  sendATCommand("AT+SMCONF=\"TOPIC\",\"" zonetopic "\"");
  sendATCommand("AT+SMCONF=\"CLIENTID\",\"" ZONE_ID "\"");
}

void publishMessage(String message) {
  int msgLength = message.length();
  String pubCommand = "AT+SMPUB=\"" + String(zonetopic) + "\"," + String(msgLength) + "," + QOS + ",0";
  simSerial.println(pubCommand);
  delay(100);
  simSerial.print(message);
  delay(3000);
}

// ===== Programme Principal =====

void setup() {
  Wire.begin(21, 22);
  delay(100);
  Serial.begin(115200);
  simSerial.begin(115200, SERIAL_8N1, 16, 17);

  powerOnSIM7080G();
  configureSIM7080G();

  // Initialisation capteurs
  if (icp.begin() != 0) {
    Serial.println("Erreur : capteur de pression ICP-10111 non détecté !");
    while (1);
  }
  icp.setWorkPattern(icp.eNormal);

  if (sht3x.begin() != 0) {
    Serial.println("Erreur : capteur SHT3x non détecté !");
    while (1);
  }

  while (!gasNO2.begin()) {
    Serial.println("Erreur capteur NO2 non détecté !");
    delay(1000);
  }
  gasNO2.changeAcquireMode(gasNO2.PASSIVITY);
  gasNO2.setTempCompensation(gasNO2.ON);

  while (!gasO3.begin()) {
    Serial.println("Erreur capteur O3 non détecté !");
    delay(1000);
  }
  gasO3.changeAcquireMode(gasO3.PASSIVITY);
  gasO3.setTempCompensation(gasO3.ON);

  // Lecture des capteurs
  float temperature = sht3x.getTemperatureC();
  float humidity = sht3x.getHumidityRH();
  float pressure = icp.getAirPressure() / 100.0; // hPa
  
  float no2_ppm = gasNO2.readGasConcentrationPPM();
  float o3_ppm  = gasO3.readGasConcentrationPPM();

  Serial.println("Température : " + String(temperature) + " C");
  Serial.println("Humidité : " + String(humidity) + " HR");
  Serial.println("Pression : " + String(pressure, 1) + " hPa");
  Serial.println("NO2 : " + String(no2_ppm, 2) + " ppm");
  Serial.println("O3 : " + String(o3_ppm, 2) + " ppm");

  String networkTime = getNetworkTime();
  int year = networkTime.substring(0, 2).toInt() + 2000;
  int month = networkTime.substring(3, 5).toInt();
  int day = networkTime.substring(6, 8).toInt();
  int hour = networkTime.substring(9, 11).toInt();

  char dateTimeBuffer[20];
  snprintf(dateTimeBuffer, sizeof(dateTimeBuffer), "%04d-%02d-%02d %02d", year, month, day, hour);

  sendATCommand("AT+SMCONN");
  delay(3000);

  // ===== Envoi des messages un par un =====

  String messageTemp = "{\"Capteur\":\"" + String(ZONE_ID) + "\",\"TypeDeDonnee\":\"Temperature\",\"Date\":\"" + String(dateTimeBuffer) + "\",\"Valeur\":" + String(temperature, 1) + "}";
  publishMessage(messageTemp);
  delay(3000);

  String messageHum = "{\"Capteur\":\"" + String(ZONE_ID) + "\",\"TypeDeDonnee\":\"Humidite\",\"Date\":\"" + String(dateTimeBuffer) + "\",\"Valeur\":" + String(humidity, 1) + "}";
  publishMessage(messageHum);
  delay(3000);

  String messagePress = "{\"Capteur\":\"" + String(ZONE_ID) + "\",\"TypeDeDonnee\":\"Pression\",\"Date\":\"" + String(dateTimeBuffer) + "\",\"Valeur\":" + String(pressure, 1) + "}";
  publishMessage(messagePress);
  delay(3000);

  String messageNO2 = "{\"Capteur\":\"" + String(ZONE_ID) + "\",\"TypeDeDonnee\":\"NO2\",\"Date\":\"" + String(dateTimeBuffer) + "\",\"Valeur\":" + String(no2_ppm, 2) + "}";
  publishMessage(messageNO2);
  delay(3000);

  String messageO3 = "{\"Capteur\":\"" + String(ZONE_ID) + "\",\"TypeDeDonnee\":\"O3\",\"Date\":\"" + String(dateTimeBuffer) + "\",\"Valeur\":" + String(o3_ppm, 2) + "}";
  publishMessage(messageO3);
  delay(3000);

  sendATCommand("AT+SMDISC");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      simSerial.println(cmd);
    }
  }

  if (simSerial.available()) {
    Serial.write(simSerial.read());
  }
}
