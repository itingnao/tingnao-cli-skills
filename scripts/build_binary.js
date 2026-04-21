#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = true;
      continue;
    }

    result[key] = next;
    index += 1;
  }

  return result;
}

function resolveHostTarget() {
  const platformMap = {
    darwin: 'macos',
    linux: 'linux',
    win32: 'win'
  };

  const archMap = {
    arm64: 'arm64',
    x64: 'x64'
  };

  const platform = platformMap[process.platform];
  const arch = archMap[process.arch];

  if (!platform || !arch) {
    throw new Error(`当前平台暂未配置二进制目标: ${process.platform}/${process.arch}`);
  }

  return `node18-${platform}-${arch}`;
}

function defaultOutputForTarget(target) {
  if (target.includes('-win-')) {
    return path.resolve(process.cwd(), 'dist/itingnao.exe');
  }

  return path.resolve(process.cwd(), 'dist/itingnao');
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const requestedTarget = args.target || 'host';
  const target = requestedTarget === 'host' ? resolveHostTarget() : requestedTarget;
  const output = args.output ? path.resolve(process.cwd(), args.output) : defaultOutputForTarget(target);
  const pkgBin = path.resolve(path.dirname(require.resolve('pkg/package.json')), 'lib-es5/bin.js');

  const result = spawnSync(process.execPath, [pkgBin, '.', '--targets', target, '--output', output], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status || 0);
}

try {
  run();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
