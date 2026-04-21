#!/usr/bin/env node

const { formatJson, parseArgs } = require('../scripts/shared');
const { uploadMedia } = require('../scripts/upload_media');
const { createTranscribeTask } = require('../scripts/create_transcribe_task');
const { parseNetworkUrl } = require('../scripts/parse_network_url');
const { getRecordDetail } = require('../scripts/get_record_detail');
const { resetHandle } = require('../scripts/reset_handle');
const { updateRecord } = require('../scripts/update_record');

const command = process.argv[2];
const args = parseArgs(process.argv.slice(3));

const commandMap = {
  upload: uploadMedia,
  'create-task': createTranscribeTask,
  'parse-url': parseNetworkUrl,
  'get-detail': getRecordDetail,
  'reset-handle': resetHandle,
  'update-record': updateRecord
};

function printHelp() {
  console.log(`
iTingnao CLI

Usage:
  itingnao <command> [options]

Commands:
  upload         Upload local audio/video and optionally create task
  create-task    Create transcription task from existing OSS key
  parse-url      Submit network URL for parsing
  get-detail     Read detail, transcript, and meeting summary
  reset-handle   Manually start transcription handling
  update-record  Update record name, transcript, or meeting summary

Examples:
  itingnao upload --file "/path/demo.mp3" --create-task --file-long "03:21"
  itingnao parse-url --url "https://v.douyin.com/xxxxx/"
  itingnao get-detail --id 6182954 --content-type meeting_summary
  itingnao reset-handle --id 6182954
  itingnao update-record --id 6182954 --append-meeting-summary "\\n\\n补充一句"

Environment:
  ITINGNAO_API_KEY   Required
`);
}

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

const script = commandMap[command];
if (!script) {
  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

(async () => {
  const result = await script(args);
  console.log(formatJson(result));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
