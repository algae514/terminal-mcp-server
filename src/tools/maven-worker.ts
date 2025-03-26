import { parentPort } from 'worker_threads';
import { spawn } from 'child_process';
import { log } from '../utils/simpleLog.js';

// Accumulate logs instead of sending them immediately
let workerLogs: string[] = [];
const logMessage = (type: string, message: string) => {
    const logMsg = `[${type}] ${message}`;
    workerLogs.push(logMsg);
    log(logMsg); // Also write to file
};

logMessage('info', 'Maven worker initialized');

parentPort?.on('message', ({ command, projectPath }) => {
    logMessage('info', 'Received command: ' + command);
    logMessage('info', 'Project path: ' + projectPath);
    
    const mvnArgs = command.split(/\s+/);
    let stdoutBuffer = '';
    let stderrBuffer = '';

    const mvnProcess = spawn('mvn', mvnArgs, {
        cwd: projectPath,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    mvnProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
    });

    mvnProcess.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
    });

    mvnProcess.on('close', (code) => {
        logMessage('info', `Maven process completed with code: ${code}`);
        parentPort?.postMessage({
            type: 'result',
            code,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            logs: workerLogs
        });
    });

    mvnProcess.on('error', (error) => {
        logMessage('error', 'Maven process error: ' + error.message);
        parentPort?.postMessage({
            type: 'result',
            error: error.message,
            logs: workerLogs
        });
    });
});