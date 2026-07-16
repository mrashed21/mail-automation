import { spawn } from 'child_process';

/**
 * Copy text to the system clipboard, cross-platform, with no external
 * dependencies:
 *
 *   - Windows: clip
 *   - macOS:   pbcopy
 *   - Linux:   xclip (fallback: xsel)
 *
 * Resolves `true` on success, `false` if no clipboard tool is available
 * (the caller should then fall back to printing / file output).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;

  if (platform === 'win32') {
    return pipeTo('clip', [], text);
  }
  if (platform === 'darwin') {
    return pipeTo('pbcopy', [], text);
  }
  // Linux / other unix
  if (await pipeTo('xclip', ['-selection', 'clipboard'], text)) {
    return true;
  }
  return pipeTo('xsel', ['--clipboard', '--input'], text);
}

/** Spawn a command and pipe `text` into its stdin. */
function pipeTo(command: string, args: string[], text: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });

      child.on('error', () => resolve(false)); // command not found
      child.on('close', (code: number | null) => resolve(code === 0));

      child.stdin.on('error', () => resolve(false));
      child.stdin.write(text);
      child.stdin.end();
    } catch {
      resolve(false);
    }
  });
}
