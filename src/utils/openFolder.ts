import { spawn } from 'child_process';

/**
 * Open a folder in the operating system's file explorer.
 * Resolves `true` if the command was launched successfully.
 */
export function openFolder(folderPath: string): Promise<boolean> {
  const platform = process.platform;

  let command: string;
  let args: string[];

  if (platform === 'win32') {
    command = 'explorer';
    args = [folderPath];
  } else if (platform === 'darwin') {
    command = 'open';
    args = [folderPath];
  } else {
    command = 'xdg-open';
    args = [folderPath];
  }

  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { stdio: 'ignore', detached: true });
      child.on('error', () => resolve(false));
      child.unref();
      // Give the spawn a moment to fail if the binary doesn't exist.
      setTimeout(() => resolve(true), 300);
    } catch {
      resolve(false);
    }
  });
}
