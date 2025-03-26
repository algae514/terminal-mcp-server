import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { log } from '../../utils/simpleLog.js';
import { ProjectConfig, ProjectRequest, ProjectRequestSchema } from './types.js';
import yaml from 'yaml';

interface ProjectContextTool extends Tool {
    parameters: typeof ProjectRequestSchema;
    execute(params: ProjectRequest): Promise<{
        content: Array<{
            type: 'text';
            text: string;
        }>;
    }>;
}

export const projectContextTool: ProjectContextTool = {
    name: 'project-context',
    description: 'Query project architecture, standards, and patterns',
    inputSchema: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'Command to execute (load/query)'
            },
            project: {
                type: 'string',
                description: 'Project identifier'
            },
            context: {
                type: 'string',
                description: 'Context to query (optional)'
            }
        }
    },
    parameters: ProjectRequestSchema,
    
    async execute(params: ProjectRequest) {
        try {
            if (params.command === 'load') {
                // Load project configuration
                const config = await loadProjectConfig(params.project);
                return {
                    content: [{
                        type: 'text' as const,
                        text: `Project ${params.project} loaded:\n${JSON.stringify(config, null, 2)}`
                    }]
                };
            }
            
            if (params.command === 'query') {
                // Query specific project information
                const info = await queryProjectInfo(params.project, params.context);
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify(info, null, 2)
                    }]
                };
            }

            throw new Error(`Unknown command: ${params.command}`);
        } catch (error) {
            log(`Error in project context tool: ${error}`);
            return {
                content: [{
                    type: 'text' as const,
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
            };
        }
    }
};

async function loadProjectConfig(projectName: string): Promise<ProjectConfig> {
    try {
        const configPath = join(process.cwd(), 'config', 'projects.yaml');
        const configData = await readFile(configPath, 'utf-8');
        const config = yaml.parse(configData);
        
        if (!config.projects?.[projectName]) {
            throw new Error(`Project ${projectName} not found in configuration`);
        }
        
        return config.projects[projectName];
    } catch (error) {
        log(`Error loading project config: ${error}`);
        throw error;
    }
}

async function queryProjectInfo(projectName: string, context?: string) {
    try {
        const config = await loadProjectConfig(projectName);
        
        if (!context) {
            return config;
        }
        
        // If context points to a file-based resource, load it
        const contextParts = context.split('.');
        let current: any = config;
        
        for (const part of contextParts) {
            if (!current[part]) {
                throw new Error(`Context ${context} not found for project ${projectName}`);
            }
            current = current[part];
            
            // If we find a path property, load the file
            if (current?.path && typeof current.path === 'string') {
                const content = await readFile(current.path, 'utf-8');
                return { [context]: content };
            }
        }
        
        return { [context]: current };
    } catch (error) {
        log(`Error querying project info: ${error}`);
        throw error;
    }
}