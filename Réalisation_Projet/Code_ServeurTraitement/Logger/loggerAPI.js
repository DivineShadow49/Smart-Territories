const { createLogger, format, transports } = require("winston");
const fs = require("fs");
const path = require("path");

const logDir = "/var/log/SmartTerritories";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const apiLogger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) =>
            `${timestamp} [API] ${level.toUpperCase()}: ${message}\n`
        )
    ),
    transports: [
        new transports.File({ filename: path.join(logDir, "api.log") }),
        //new transports.Console() // optionnel pour debug local
    ]
});

module.exports = apiLogger;
