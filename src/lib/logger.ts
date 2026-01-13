import winston from "winston";
import { config } from "./config";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = config.stage || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "info";
};

// Define colors for each level (for console output)
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Custom format for console logging
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.metadata ? ' ' + JSON.stringify(info.metadata) : ''}`
  )
);

// JSON format for file/production logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Helper to sanitize sensitive data before logging
export const sanitize = (data: any) => {
  if (!data) return data;
  const sanitized = { ...data };
  const sensitiveKeys = ["password", "token", "secret", "key", "authorization"];
  
  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = "***";
    }
  });
  
  return sanitized;
};
