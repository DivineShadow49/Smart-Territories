const { createLogger, format, transports } = require("winston");
const fs = require("fs");
const path = require("path");

const logDir = "/var/log/SmartTerritories";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const mqttLogger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) =>
            `${timestamp} [MQTT] ${level.toUpperCase()}: ${message}\n`
        )
    ),
    transports: [
        new transports.File({ filename: path.join(logDir, "mqtt.log") }),
        //new transports.Console() // optionnel pour afficher les logs dans la console
    ]
});

//Ligne de test des logs
//mqttLogger.info("Test de log MQTT écrit depuis loggerMQTT.js");

module.exports = mqttLogger;
