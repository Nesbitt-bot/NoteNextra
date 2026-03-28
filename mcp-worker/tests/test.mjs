#!/usr/bin/env node

/**
 * Test suite for NoteNextra MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

async function runTest(testName, command, args = []) {
  console.log(`\n🧪 Running: ${testName}`);
  console.log(`Command: ${command} ${args.join(' ')}`);

  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} passed`);
      } else {
        console.log(`❌ ${testName} failed with code ${code}`);
      }
      resolve(code === 0);
    });

    proc.on('error', (error) => {
      console.log(`❌ ${testName} error: ${error.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 NoteNextra MCP Server Tests\n');

  const results = {
    'Install Dependencies': false,
    'MCP Server': false,
    'SSR Server': false,
  };

  try {
    results['Install Dependencies'] = await runTest(
      'Install Dependencies',
      'npm',
      ['install', '--silent']
    );

    if (results['Install Dependencies']) {
      results['MCP Server'] = await runTest('MCP Server', 'node', [
        'mcp-worker/index.js',
      ], { timeout: 2000 });

      results['SSR Server'] = await runTest('SSR Server', 'node', [
        'mcp-worker/server.js',
      ], { timeout: 2000 });
    }
  } catch (error) {
    console.log(`\n❌ Test suite error: ${error.message}`);
  }

  console.log('\n📊 Test Results:');
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${name}`);
  });

  const allPassed = Object.values(results).every((result) => result === true);
  process.exit(allPassed ? 0 : 1);
}

main();