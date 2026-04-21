#!/usr/bin/env node

const path = require('path');
const {
  formatJson,
  getConfig,
  normalizeStyle,
  parseArgs,
  requestJSON
} = require('./shared');

async function createTranscribeTask(options = {}) {
  const config = getConfig(options);
  const filePath = options.filePath || options['file-path'];
  const fileName = options.name || (filePath ? path.basename(filePath) : '');
  const style = normalizeStyle(options.style, fileName);

  if (!filePath) {
    throw new Error('缺少 --file-path 参数');
  }

  if (!fileName) {
    throw new Error('缺少 --name 参数');
  }

  if (!style) {
    throw new Error('无法识别文件类型，请通过 --style audio|video 指定');
  }

  const payload = {
    trans_type: Number(options['trans-type'] || 1),
    chat_num: Number(options['chat-num'] || 1),
    style,
    source_type: options['source-type'] ? Number(options['source-type']) : null,
    file_source_type: Number(options['file-source-type'] || 1),
    name: fileName,
    file_path: filePath,
    file_long: options['file-long'] || '00:00',
    scene_id: Number(options['scene-id'] || 1),
    source_channel: Number(options['source-channel'] || 2),
    meets_example_id: Number(options['meets-example-id'] || 0),
    parent_model: Number(options['parent-model'] || 0),
    is_knowledge: Number(options['is-knowledge'] || 0),
    knowledge_id: Number(options['knowledge-id'] || 0),
    folder_id: Number(options['folder-id'] || 0),
    file_oss_source: Number(options['file-oss-source'] || 0)
  };

  if (options['selected-language']) {
    payload.selected_language = Number(options['selected-language']);
  }

  if (options['create-time']) {
    payload.create_time = options['create-time'];
  }

  const response = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'POST',
    apiPath: '/api/record/create',
    body: payload
  });

  const recordId = Array.isArray(response.data) ? response.data[0] && response.data[0].id : response.data && response.data.id;

  return {
    success: response.code === 200,
    recordId: recordId || null,
    request: payload,
    response
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await createTranscribeTask(args);
  console.log(formatJson(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  createTranscribeTask
};
