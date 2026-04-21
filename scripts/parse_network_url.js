#!/usr/bin/env node

const {
  formatJson,
  getConfig,
  parseArgs,
  requestJSON
} = require('./shared');

async function parseNetworkUrl(options = {}) {
  const config = getConfig(options);
  const url = options.url;

  if (!url) {
    throw new Error('缺少 --url 参数');
  }

  const sourceType = options['source-type'] || '';
  const knowledgeId = Number(options['knowledge-id'] || 0);
  const folderId = Number(options['folder-id'] || 0);
  const payload = {
    url: String(url).split('\n').map((item) => item.trim()).filter(Boolean),
    parent_model: Number(options['parent-model'] || 221),
    language: options.language ? Number(options.language) : 1,
    is_knowledge: 0,
    knowledge_id: 0,
    folder_id: 0
  };

  if (sourceType === 'knowledeg' || knowledgeId > 0) {
    payload.is_knowledge = 1;
    payload.knowledge_id = knowledgeId;
  }

  if (sourceType === 'folder' || folderId > 0) {
    payload.folder_id = folderId;
  }

  const response = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'POST',
    apiPath: '/api/record/parse_network_url',
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
  const result = await parseNetworkUrl(args);
  console.log(formatJson(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  parseNetworkUrl
};
