#!/usr/bin/env node

import { saveConfig } from './config.js';
import { startMcpServer } from './server.js';

const [, , command, subcommand, ...args] = process.argv;

try {
  if (!command || command === '--help' || command === '-h') {
    printUsage();
  } else if (command === 'mcp') {
    await startMcpServer();
  } else if (command === 'config' && subcommand === 'set') {
    await handleConfigSet(args);
  } else {
    printUsage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function handleConfigSet(args: string[]): Promise<void> {
  const apiUrl = readOption(args, '--api-url');
  const token = readOption(args, '--pat');
  const defaultResumeId = readOption(args, '--default-resume-id');

  if (!apiUrl || !token) {
    throw new Error('Missing required options: --api-url and --pat');
  }

  await saveConfig({
    apiUrl,
    token,
    defaultResumeId,
  });

  console.log('Magic Resume MCP config saved.');
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${name}`);
  }

  return value;
}

function printUsage(): void {
  console.log('Magic Resume CLI');
  console.log('Usage:');
  console.log('  magic-resume config set --api-url <url> --pat <token> [--default-resume-id <id>]');
  console.log('  magic-resume mcp');
}
