import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');
const logFile = join(logDir, 'mcp-server.log');

// Ensure logs directory exists
try {
    mkdirSync(logDir, { recursive: true });
} catch (error) {
    // If directory already exists or can't be created, we'll catch it when trying to write logs
}

export const log = (message: string) => {
    try {
        appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
    } catch (error) {
        // Silent fail - if we can't log, we can't log about not being able to log
    }
};