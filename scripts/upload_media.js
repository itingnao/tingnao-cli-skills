#!/usr/bin/env node

const path = require('path');
const {
  buildOssKey,
  ensureFileExists,
  formatJson,
  getConfig,
  normalizeStyle,
  parseArgs,
  requestJSON,
  uploadToOss
} = require('./shared');
const { createTranscribeTask } = require('./create_transcribe_task');

async function uploadMedia(options = {}) {
  const config = getConfig(options);
  const filePath = options.file || options['file-path'];
  const ossDir = options['oss-dir'] || '';

  const stats = ensureFileExists(filePath);
  const fileName = path.basename(filePath);
  const style = normalizeStyle(options.style, fileName);

  if (!style) {
    throw new Error('仅支持音频或视频文件，请检查扩展名或通过 --style audio|video 指定');
  }

  const signResponse = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'GET',
    apiPath: '/api/common/sign',
    query: {
      oss_dir: ossDir
    }
  });

  if (signResponse.code !== 200 || !signResponse.data) {
    throw new Error(`获取上传签名失败: ${JSON.stringify(signResponse)}`);
  }

  const signData = signResponse.data;
  const key = buildOssKey(signData.dir, fileName);

  await uploadToOss({
    host: signData.host,
    filePath,
    fileName,
    key,
    policy: signData.policy,
    accessid: signData.accessid,
    signature: signData.signature
  });

  const uploadResult = {
    success: true,
    fileName,
    filePath,
    fileSize: stats.size,
    style,
    key,
    ossUrl: `${signData.host}/${key}`,
    sign: {
      host: signData.host,
      dir: signData.dir
    }
  };

  if (!options['create-task']) {
    return uploadResult;
  }

  const taskResult = await createTranscribeTask({
    ...options,
    'file-path': key,
    name: fileName,
    style: style === 1 ? 'video' : 'audio'
  });

  return {
    ...uploadResult,
    task: taskResult
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await uploadMedia(args);
  console.log(formatJson(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  uploadMedia
};
