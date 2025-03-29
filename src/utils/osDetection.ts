import os from 'os';
import { log } from './simpleLog.js';

export interface OSInfo {
  platform: string;
  type: 'windows' | 'macos' | 'ios' | 'linux' | 'unknown';
  version: string;
  shell: string;
  description: string;
}

/**
 * Detects the current operating system and returns detailed information
 * @returns OSInfo object with platform, type, version, shell, and description
 */
export function detectOS(): OSInfo {
  const platform = os.platform();
  const release = os.release();
  let type: 'windows' | 'macos' | 'ios' | 'linux' | 'unknown' = 'unknown';
  let shell = '';
  let version = release;
  let description = '';

  log(`Detected platform: ${platform}, release: ${release}`);

  switch (platform) {
    case 'win32':
      type = 'windows';
      shell = 'powershell.exe';
      
      // Windows 10 and 11 detection
      if (release.startsWith('10.0.')) {
        const buildNumber = parseInt(release.split('.')[2], 10);
        if (buildNumber >= 22000) {
          description = 'Windows 11';
        } else {
          description = 'Windows 10';
        }
      } else if (release.startsWith('6.3.')) {
        description = 'Windows 8.1';
      } else if (release.startsWith('6.2.')) {
        description = 'Windows 8';
      } else if (release.startsWith('6.1.')) {
        description = 'Windows 7';
      } else {
        description = `Windows (Build ${release})`;
      }
      break;

    case 'darwin':
      // Check if it's iOS or macOS
      // This is a simplistic approach - in reality, iOS detection might need more work
      // since Node.js isn't typically run directly on iOS
      const macVersion = release.split('.')[0];
      if (parseInt(macVersion, 10) >= 20) {
        type = 'ios';
        shell = 'sh';
        description = `iOS (Version ${release})`;
      } else {
        type = 'macos';
        shell = 'bash';
        
        // Map macOS version numbers to names
        const macOSVersions: Record<string, string> = {
          '22': 'Ventura',
          '21': 'Monterey',
          '20': 'Big Sur',
          '19': 'Catalina',
          '18': 'Mojave',
          '17': 'High Sierra',
          '16': 'Sierra',
          '15': 'El Capitan',
          '14': 'Yosemite',
          '13': 'Mavericks',
          '12': 'Mountain Lion',
          '11': 'Lion',
          '10': 'Snow Leopard'
        };
        
        const versionName = macOSVersions[macVersion] || '';
        description = versionName ? `macOS ${versionName}` : `macOS (Version ${release})`;
      }
      break;

    case 'linux':
      type = 'linux';
      shell = 'bash';
      description = `Linux (Version ${release})`;
      break;

    default:
      type = 'unknown';
      shell = 'sh';
      description = `Unknown OS (${platform}, ${release})`;
  }

  log(`OS detection result: ${type}, ${description}, shell: ${shell}`);
  
  return {
    platform,
    type,
    version: release,
    shell,
    description
  };
}

/**
 * Returns the appropriate shell command prefix based on the OS
 * @returns Command prefix string
 */
export function getShellCommandPrefix(): string {
  const { type, shell } = detectOS();
  
  switch (type) {
    case 'windows':
      return 'powershell.exe -Command';
    case 'macos':
    case 'ios':
      return shell;
    case 'linux':
      return shell;
    default:
      return 'sh';
  }
}

/**
 * Formats a command appropriately for the current OS
 * @param command The command to format
 * @returns Formatted command string
 */
export function formatCommandForOS(command: string): string {
  const { type } = detectOS();
  
  if (type === 'windows') {
    // For Windows, we might need to escape certain characters or adjust commands
    // This is a simple example - more complex command translation might be needed
    return command.replace(/\//g, '\\');
  }
  
  return command;
}