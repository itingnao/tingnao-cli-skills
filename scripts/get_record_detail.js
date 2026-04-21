#!/usr/bin/env node

const {
  formatJson,
  getConfig,
  parseArgs,
  requestJSON
} = require('./shared');

function getOverallStatusText(detail = {}) {
  const status = Number(detail.status);

  if (status === -2) {
    return '权益受限';
  }
  if (status === 90) {
    return '需手动生成转写';
  }
  if (status === 100) {
    return '文件解析失败';
  }
  if (status === 4) {
    return '处理完成';
  }
  if ([0, 1, 2, 11, 12, 101].includes(status)) {
    return '处理中';
  }

  return '未知状态';
}

function getTranscriptStatusText(detail = {}) {
  const status = Number(detail.status);
  const dataStatus = detail.data_status === undefined ? null : Number(detail.data_status);
  const hasTranscript = Array.isArray(detail.data) && detail.data.length > 0;

  if (status === -2) {
    return '权益受限';
  }
  if (dataStatus === 2 || status === 100) {
    return '转写失败';
  }
  if (dataStatus === 1) {
    return '转写完成';
  }
  if (status === 90) {
    return '需手动生成转写';
  }
  if (hasTranscript && status === 4) {
    return '转写完成';
  }
  if (dataStatus === 0 || [0, 1, 2, 101, 11, 12].includes(status)) {
    return '转写中';
  }
  if (hasTranscript) {
    return '转写完成';
  }

  return '未知状态';
}

function getMeetingSummaryStatusText(detail = {}) {
  const summaryStatus = detail.meeting_summary_status === undefined
    ? null
    : Number(detail.meeting_summary_status);

  if (summaryStatus === 2) {
    return '纪要已生成';
  }
  if (summaryStatus === -1) {
    return '纪要生成失败';
  }
  if (summaryStatus === -2 || summaryStatus === 0 || summaryStatus === 1) {
    return '纪要生成中';
  }
  if (Number(detail.status) === 90) {
    return '需先手动生成转写';
  }
  if (detail.meeting_summary) {
    return '纪要已返回';
  }

  return '暂无纪要';
}

function normalizeDetail(detail = {}) {
  const transcript = Array.isArray(detail.data) ? detail.data : [];
  const meetingSummary = detail.meeting_summary || '';
  const meetingSummaryStatus = detail.meeting_summary_status === undefined
    ? null
    : Number(detail.meeting_summary_status);
  const dataStatus = detail.data_status === undefined ? null : Number(detail.data_status);
  const overallStatus = detail.status === undefined ? null : Number(detail.status);

  return {
    id: detail.id || null,
    name: detail.name || '',
    source: {
      transcript: 'detail.data',
      meetingSummary: 'detail.meeting_summary'
    },
    status: {
      value: overallStatus,
      text: getOverallStatusText(detail),
      done: overallStatus === 4,
      restricted: overallStatus === -2,
      failed: overallStatus === 100,
      processing: [0, 1, 2, 11, 12, 101].includes(overallStatus),
      manualTriggerRequired: overallStatus === 90
    },
    transcript: {
      data: transcript,
      count: transcript.length,
      status: {
        value: dataStatus,
        text: getTranscriptStatusText(detail),
        done: dataStatus === 1,
        failed: dataStatus === 2 || overallStatus === 100,
        processing: dataStatus === 0 || [0, 1, 2, 101, 11, 12].includes(overallStatus),
        manualTriggerRequired: overallStatus === 90
      }
    },
    meetingSummary: {
      content: meetingSummary,
      status: {
        value: meetingSummaryStatus,
        text: getMeetingSummaryStatusText(detail),
        done: meetingSummaryStatus === 2,
        failed: meetingSummaryStatus === -1,
        processing: meetingSummaryStatus === -2
          || meetingSummaryStatus === 0
          || meetingSummaryStatus === 1,
        manualTriggerRequired: overallStatus === 90
      }
    },
    raw: detail
  };
}

async function getRecordDetail(options = {}) {
  const config = getConfig(options);
  const id = Number(options.id);

  if (!id) {
    throw new Error('缺少 --id 参数');
  }

  const query = {
    id,
    summary_new: options['summary-new'] || '1'
  };

  if (options['content-type']) {
    query.content_type = options['content-type'];
  }

  const response = await requestJSON({
    baseURL: config.baseURL,
    token: config.token,
    teamId: config.teamId,
    method: 'GET',
    apiPath: '/api/record/detail',
    query
  });

  if (response.code !== 200 || !response.data) {
    throw new Error(`读取记录详情失败: ${JSON.stringify(response)}`);
  }

  return {
    success: true,
    request: query,
    detail: normalizeDetail(response.data)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await getRecordDetail(args);
  console.log(formatJson(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  getRecordDetail,
  normalizeDetail
};
