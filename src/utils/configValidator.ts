import { readFile } from 'fs/promises';
import { z } from 'zod';
import { join } from 'path';
import { log } from './simpleLog.js';

// Define config schema
const ConfigSchema = z.object({
  allowedPaths: z.array(z.string())
});

type Config = z.infer<typeof ConfigSchema>;

let config: Config | null = null;

export async function loadConfig(configPath?: string): Promise<void> {
  try {
    const path = configPath || join(process.cwd(), 'maven-tool.json');
    const content = await readFile(path, 'utf-8');
    const parsedConfig = JSON.parse(content);
    config = ConfigSchema.parse(parsedConfig);
    log(`Loaded config with ${config.allowedPaths.length} allowed paths`);
  } catch (error) {
    log(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export function isPathAllowed(path: string): boolean {
  if (!config) {
    log('Config not loaded');
    return false;
  }

  const normalizedPath = path.replace(/\\/g, '/');
  const isAllowed = config.allowedPaths.some(allowedPath => 
    normalizedPath.startsWith(allowedPath.replace(/\\/g, '/'))
  );

  if (!isAllowed) {
    log(`Path not allowed: ${path}`);
  }
  
  return isAllowed;
}