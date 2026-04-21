#!/usr/bin/env node

const {
  formatJson,
  getConfig,
  parseArgs,
  requestJSON
} = require('./shared');

async function resetHandle(options = {}) {
  const config = getConfig(options);
  const id = Number(options.id);

  if (!id) {
    throw new Error('缺少 --id 参数');
  }

  const payload = {
    id,
    privilege_type: Number(options['privilege-type'] || 1)
  };

  const response = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'POST',
    apiPath: '/api/record/reset_handle',
    body: payload
  });

  return {
    success: response.code === 200,
    request: payload,
    response
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await resetHandle(args);
  console.log(formatJson(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  resetHandle
};
