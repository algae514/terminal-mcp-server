import { parentPort } from 'worker_threads';
import { spawn } from 'child_process';
import { log } from '../utils/simpleLog.js';
import { detectOS, formatCommandForOS } from '../utils/osDetection.js';

let workerLogs: string[] = [];
const logMessage = (type: string, message: string) => {
    const logMsg = `[${type}] ${message}`;
    workerLogs.push(logMsg);
    log(logMsg);
};

// Detect OS on worker initialization
const osInfo = detectOS();
logMessage('info', `Terminal worker initialized on ${osInfo.description}`);

parentPort?.on('message', ({ command, workingDir }) => {
    logMessage('info', `Received command: ${command}`);
    logMessage('info', `Working directory: ${workingDir}`);
    
    let stdoutBuffer = '';
    let stderrBuffer = '';

    // Format command for the current OS
    const formattedCommand = formatCommandForOS(command);
    logMessage('info', `Formatted command for ${osInfo.type}: ${formattedCommand}`);

    // Determine how to execute the command based on OS
    let spawnOptions: any = {
        cwd: workingDir,
        shell: true,  // Use shell to support shell features and command chaining
        stdio: ['ignore', 'pipe', 'pipe']
    };

    let cmd: string;
    let args: string[];

    if (osInfo.type === 'windows') {
        // For Windows, use PowerShell
        cmd = 'powershell.exe';
        args = ['-Command', formattedCommand];
        logMessage('info', `Using PowerShell to execute command`);
    } else {
        // For macOS, iOS, Linux, etc.
        // Split command into command and arguments
        [cmd, ...args] = formattedCommand.split(/\s+/);
        logMessage('info', `Using standard shell to execute command`);
    }
    
    const process = spawn(cmd, args, spawnOptions);

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