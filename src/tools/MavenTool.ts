import { z } from 'zod';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from '../utils/simpleLog.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';

// Define the parameters schema
export const MavenParametersSchema = z.object({
  command: z.string().describe('Maven command to execute (e.g., "clean install")'),
  projectPath: z.string().describe('Absolute path to the Maven project directory containing pom.xml')
});

export type MavenParameters = z.infer<typeof MavenParametersSchema>;

// Define the Tool interface with proper types
interface MavenTool extends Tool {
  parameters: typeof MavenParametersSchema;
  execute(params: MavenParameters): Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }>;
}

export const mavenTool: MavenTool = {
  name: 'maven',
  description: `Execute Maven commands for Java project management`,
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Maven command to execute (e.g., "clean install")'
      },
      projectPath: {
        type: 'string',
        description: 'Absolute path to the Maven project directory containing pom.xml'
      }
    }
  },
  parameters: MavenParametersSchema,
  
  async execute(params: MavenParameters) {
    log(`MAVEN: Tool Execute  - Input params: ${JSON.stringify(params)}`);
    
    return new Promise((resolve) => {
      try {
        // Validate project path exists
        if (!existsSync(params.projectPath)) {
          throw new Error(`Project path does not exist: ${params.projectPath}`);
        }

        // Check for pom.xml
        const pomPath = join(params.projectPath, 'pom.xml');
        if (!existsSync(pomPath)) {
          throw new Error(`No pom.xml found in project path: ${params.projectPath}`);
        }

        log(`MAVEN: - Starting worker thread`);
        
        // Initialize worker
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const workerPath = join(__dirname, 'maven-worker.js');
        
        log(`MAVEN:  - Worker path: ${workerPath}`);
        const worker = new Worker(workerPath);

        worker.on('message', (message) => {
          // Handle worker results
          if (message.type === 'result') {
            // Log all accumulated worker logs
            if (message.logs && Array.isArray(message.logs)) {
              message.logs.forEach((logMsg: string) => log(`MAVEN: ${logMsg}`));
            }
            
            if (message.error) {
              const response = {
                content: [{
                  type: 'text' as const,
                  text: `Maven execution error: ${message.error}`
                }]
              };
              log(`MAVEN:  - Worker reported error: ${message.error}`);
              resolve(response);
            } else {
              // Combine stdout and stderr for error cases
              let outputText = '';
              if (message.code !== 0) {
                // For non-zero exit codes, include both stdout and stderr
                outputText = [
                  message.stdout && message.stdout.trim(),
                  message.stderr && message.stderr.trim(),
                  `Exit Code: ${message.code}`
                ].filter(Boolean).join('\n\n');
              } else {
                // For successful execution, just show stdout
                outputText = message.stdout;
              }

              const response = {
                content: [{
                  type: 'text' as const,
                  text: outputText || `Process completed with code ${message.code}`
                }]
              };
              log(`MAVEN: - Worker completed with code: ${message.code}`);
              resolve(response);
            }
            worker.terminate();
          }
        });

        worker.on('error', (error) => {
          const response = {
            content: [{
              type: 'text' as const,
              text: `Worker error: ${error.message}`
            }]
          };
          log(`MAVEN:  - Worker error: ${error.message}`);
          resolve(response);
          worker.terminate();
        });

        // Send command to worker
        log(`MAVEN:  - Sending command to worker`);
        worker.postMessage({
          command: params.command,
          projectPath: params.projectPath
        });

      } catch (error) {
        const response = {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
        log(`MAVEN: - Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        resolve(response);
      }
    });
  }
};