#!/usr/bin/env node

const fs = require('fs');
const {
  formatJson,
  getConfig,
  parseArgs,
  requestJSON
} = require('./shared');

function readJsonFile(filePath) {
  if (!filePath) {
    return undefined;
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON 文件不存在: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function getRecordDetail(config, id) {
  const response = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'GET',
    apiPath: '/api/record/detail',
    query: { id }
  });

  if (response.code !== 200 || !response.data) {
    throw new Error(`读取记录详情失败: ${JSON.stringify(response)}`);
  }

  return response.data;
}

async function updateRecord(options = {}) {
  const config = getConfig(options);
  const id = Number(options.id);

  if (!id) {
    throw new Error('缺少 --id 参数');
  }

  const payload = { id };
  const hasMeetingSummary = options['meeting-summary'] !== undefined;
  const hasAppendMeetingSummary = options['append-meeting-summary'] !== undefined;
  const hasDataFile = options['data-file'] !== undefined;
  const hasReplaceFirstText = options['replace-first-text'] !== undefined;
  const hasAppendFirstText = options['append-first-text'] !== undefined;
  const needDetail =
    hasAppendMeetingSummary
    || (hasMeetingSummary && options['example-id'] === undefined)
    || hasReplaceFirstText
    || hasAppendFirstText;
  let detail = null;

  if (hasMeetingSummary && hasAppendMeetingSummary) {
    throw new Error('--meeting-summary 和 --append-meeting-summary 只能二选一');
  }

  if (Number(hasDataFile) + Number(hasReplaceFirstText) + Number(hasAppendFirstText) > 1) {
    throw new Error('--data-file、--replace-first-text 和 --append-first-text 只能选择一种原文更新模式');
  }

  if (needDetail) {
    detail = await getRecordDetail(config, id);
  }

  if (options.name) {
    payload.name = options.name;
  }

  if (hasMeetingSummary || hasAppendMeetingSummary) {
    payload.example_id = Number(
      options['example-id'] !== undefined
        ? options['example-id']
        : (detail && detail.example_id) || 0
    );

    if (hasMeetingSummary) {
      payload.meeting_summary = options['meeting-summary'];
    } else {
      const currentSummary = (detail && detail.meeting_summary) || '';
      payload.meeting_summary = `${currentSummary}${options['append-meeting-summary']}`;
    }
  }

  if (hasDataFile) {
    payload.data = readJsonFile(options['data-file']);
  }

  if (hasReplaceFirstText || hasAppendFirstText) {
    const currentData = Array.isArray(detail && detail.data)
      ? detail.data.map((item) => ({ ...item }))
      : [];

    if (!currentData.length) {
      throw new Error('当前记录没有原文 data，无法执行第一句文本快捷更新');
    }

    const firstItem = currentData[0];
    const currentText = firstItem.text || '';
    firstItem.text = hasReplaceFirstText
      ? options['replace-first-text']
      : `${currentText}${options['append-first-text']}`;

    payload.data = currentData;
  }

  if (options['raw-json-file']) {
    const extraPayload = readJsonFile(options['raw-json-file']);
    Object.assign(payload, extraPayload);
  }

  if (Object.keys(payload).length === 1) {
    throw new Error('没有可更新的字段，请至少传入 --name、--meeting-summary、--append-meeting-summary、--data-file、--replace-first-text、--append-first-text 或 --raw-json-file');
  }

  const response = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'PUT',
    apiPath: '/api/record/update',
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
  const result = await updateRecord(args);
  console.log(formatJson(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  updateRecord
};
