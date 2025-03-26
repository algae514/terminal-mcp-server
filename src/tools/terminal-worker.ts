import { parentPort } from 'worker_threads';
import { spawn } from 'child_process';
import { log } from '../utils/simpleLog.js';

let workerLogs: string[] = [];
const logMessage = (type: string, message: string) => {
    const logMsg = `[${type}] ${message}`;
    workerLogs.push(logMsg);
    log(logMsg);
};

logMessage('info', 'Terminal worker initialized');

parentPort?.on('message', ({ command, workingDir }) => {
    logMessage('info', `Received command: ${command}`);
    logMessage('info', `Working directory: ${workingDir}`);
    
    let stdoutBuffer = '';
    let stderrBuffer = '';

    // Split command into command and arguments
    const [cmd, ...args] = command.split(/\s+/);
    
    const process = spawn(cmd, args, {
        cwd: workingDir,
        shell: true,  // Use shell to support shell features and command chaining
        stdio: ['ignore', 'pipe', 'pipe']
    });

    process.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
    });

    process.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
    });

    process.on('close', (code) => {
        logMessage('info', `Command process completed with code: ${code}`);
        parentPort?.postMessage({
            type: 'result',
            code,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            logs: workerLogs
        });
    });

    process.on('error', (error) => {
        logMessage('error', `Command process error: ${error.message}`);
        parentPort?.postMessage({
            type: 'result',
            error: error.message,
            logs: workerLogs
        });
    });
});