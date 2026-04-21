#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Blob } = require('buffer');

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'amr']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm']);

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

function getConfig(options = {}) {
  const token = process.env.ITINGNAO_API_KEY;
  const teamId = options.teamId || options['team-id'] || '';
  const baseURL = 'https://api.itingnao.com';

  if (!token) {
    throw new Error('缺少环境变量 ITINGNAO_API_KEY');
  }

  return {
    token,
    teamId,
    baseURL
  };
}

function ensureFileExists(filePath) {
  if (!filePath) {
    throw new Error('缺少文件路径');
  }

  if (!path.isAbsolute(filePath)) {
    throw new Error(`文件路径必须为绝对路径: ${filePath}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error(`目标不是文件: ${filePath}`);
  }

  return stats;
}

function createHeaders(token, extraHeaders = {}) {
  return {
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${token}`,
    ...extraHeaders
  };
}

function buildUrl(baseURL, apiPath, query = {}) {
  const target = new URL(apiPath, baseURL);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, String(item)));
      return;
    }

    target.searchParams.set(key, String(value));
  });
  return target.toString();
}

async function requestJSON({ baseURL, token, teamId, method, apiPath, query, body, extraHeaders }) {
  const normalizedMethod = method.toUpperCase();
  const finalQuery = { ...(query || {}) };
  let finalBody = body;

  if (teamId) {
    if (normalizedMethod === 'GET') {
      finalQuery.team_id = teamId;
    } else if (finalBody && typeof finalBody === 'object' && !Array.isArray(finalBody)) {
      finalBody = { team_id: teamId, ...finalBody };
    }
  }

  const url = buildUrl(baseURL, apiPath, finalQuery);
  const headers = createHeaders(token, extraHeaders);
  const options = {
    method: normalizedMethod,
    headers
  };

  if (finalBody !== undefined && normalizedMethod !== 'GET') {
    headers['Content-Type'] = 'application/json;charset=UTF-8';
    options.body = JSON.stringify(finalBody);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`接口返回非 JSON: ${text}`);
  }

  if (!response.ok) {
    throw new Error(`请求失败 ${response.status}: ${text}`);
  }

  return data;
}

function normalizeStyle(input, fileName = '') {
  if (input === 1 || input === '1' || input === 'video') {
    return 1;
  }

  if (input === 2 || input === '2' || input === 'audio') {
    return 2;
  }

  if (fileName) {
    const extension = path.extname(fileName).toLowerCase().replace('.', '');
    if (VIDEO_EXTENSIONS.has(extension)) {
      return 1;
    }
    if (AUDIO_EXTENSIONS.has(extension)) {
      return 2;
    }
  }

  return 0;
}

function getMimeType(fileName) {
  const extension = path.extname(fileName).toLowerCase().replace('.', '');

  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'm4a') return 'audio/mp4';
  if (extension === 'aac') return 'audio/aac';
  if (extension === 'flac') return 'audio/flac';
  if (extension === 'ogg') return 'audio/ogg';
  if (extension === 'amr') return 'audio/amr';
  if (extension === 'mp4') return 'video/mp4';
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'm4v') return 'video/x-m4v';
  if (extension === 'avi') return 'video/x-msvideo';
  if (extension === 'mkv') return 'video/x-matroska';
  if (extension === 'webm') return 'video/webm';

  return 'application/octet-stream';
}

function randomId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildOssKey(dir, fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return `${dir}${randomId()}${extension}`;
}

async function uploadToOss({ host, filePath, fileName, key, policy, accessid, signature }) {
  const mimeType = getMimeType(fileName);
  const fileBuffer = fs.readFileSync(filePath);
  const form = new FormData();

  form.append('key', key);
  form.append('policy', policy);
  form.append('OSSAccessKeyId', accessid);
  form.append('success_action_status', '200');
  form.append('signature', signature);
  form.append('name', fileName);
  form.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(host, {
    method: 'POST',
    body: form
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OSS 上传失败 ${response.status}: ${text}`);
  }

  return {
    status: response.status,
    text
  };
}

function formatJson(data) {
  return JSON.stringify(data, null, 2);
}

module.exports = {
  buildOssKey,
  ensureFileExists,
  formatJson,
  getConfig,
  normalizeStyle,
  parseArgs,
  requestJSON,
  uploadToOss
};
