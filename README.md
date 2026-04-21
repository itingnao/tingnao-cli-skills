# iTingnao Skill

让 OpenClaw 直接连接听脑，上传本地音频/视频到 OSS，创建转写任务，或提交网络链接进行解析，并读取文件详情、原文、纪要。

---

## 核心能力

| 能力 | 说明 |
|------|------|
| 本地音频/视频上传 | 读取本地文件，调用听脑上传签名接口，直传 OSS |
| 创建转写任务 | 上传成功后调用 `/api/record/create` 创建任务 |
| 网络链接解析 | 调用 `/api/record/parse_network_url` 提交网络链接 |
| 查询处理状态 | 轮询 `/api/record/list_by_record_id` 查看转写进度 |
| 获取文件内容 | 读取文件详情、原文、纪要，纪要来自 `record/detail.meeting_summary` |
| 文件列表搜索 | 按文件名搜索历史文件 |
| 内容更新 | 更新原文、纪要或文件基础内容 |
| 文件夹操作 | 创建文件夹、移动文件到文件夹 |

---

## 安装

### 方式一：本地目录安装

将 `itingnao-1.0.1` 放到 OpenClaw 的 skills 目录中。

### 方式二：作为本地 CLI 使用

在 `itingnao-1.0.1` 目录下执行：

```bash
npm link
```

之后可直接使用：

```bash
itingnao upload --file "/path/demo.mp3" --create-task --file-long "03:21"
itingnao parse-url --url "https://v.douyin.com/xxxxx/"
itingnao get-detail --id 6182954 --content-type meeting_summary
itingnao reset-handle --id 6182954
itingnao update-record --id 6182954 --append-meeting-summary "\n\n补充一句"
```

### 方式三：打包成本地二进制

在 `itingnao-1.0.1` 目录下执行：

```bash
npm install
npm run build:binary:host
```

构建产物会输出到 `dist/`，当前机器上可直接运行：

```bash
./dist/itingnao --help
```

如果要打包指定平台，也可以使用：

```bash
npm run build:binary:macos-arm64
npm run build:binary:macos-x64
npm run build:binary:linux-x64
npm run build:binary:win-x64
```

### 方式四：手动安装

```bash
mkdir -p ~/.openclaw/workspace/skills/itingnao
cp -R ./itingnao-1.0.1/* ~/.openclaw/workspace/skills/itingnao/
```

---

## 环境要求

- Node.js 18+
- 已有可用的听脑 API Key
- 如果要构建二进制，需要先执行 `npm install`

---

## 配置

在 `~/.openclaw/openclaw.json` 中为 `itingnao` 配置环境变量：

```json
{
  "skills": {
    "entries": {
      "itingnao": {
        "env": {
          "ITINGNAO_API_KEY": "你的 API Key"
        }
      }
    }
  }
}
```

说明：

- `ITINGNAO_API_KEY`：推荐使用，对外按 API Key 配置；实际请求仍会自动拼成 `Authorization: Bearer {API Key}`
- 默认使用生产环境 `https://api.itingnao.com`
- 团队空间请求时，通过脚本参数 `--team-id` 传入；读取到值后，脚本会写入请求参数 `team_id`

---

## 使用示例

### 上传本地音频并创建转写任务

```bash
node scripts/upload_media.js --file "/absolute/path/demo.mp3" --create-task --file-long "03:21"
```

或使用 CLI：

```bash
itingnao upload --file "/absolute/path/demo.mp3" --create-task --file-long "03:21"
```

### 仅上传，返回 OSS key

```bash
node scripts/upload_media.js --file "/absolute/path/demo.mp4"
```

### 用已有 OSS key 创建转写任务

```bash
node scripts/create_transcribe_task.js --file-path "record/2026/04/demo.mp3" --name "demo.mp3" --style audio --file-long "03:21"
```

### 提交网络链接解析

支持抖音、小红书、B站、快手、小宇宙等音视频链接，以及公众号、知乎、微博、36氪、公开网站链接。

```bash
node scripts/parse_network_url.js --url "https://v.douyin.com/xxxxx/"
```

或使用 CLI：

```bash
itingnao parse-url --url "https://v.douyin.com/xxxxx/"
```

### 更新纪要内容

```bash
node scripts/update_record.js --id 6182954 --example-id 0 --meeting-summary "全文内容太短，暂无纪要内\n"
```

或使用 CLI：

```bash
itingnao update-record --id 6182954 --example-id 0 --meeting-summary "全文内容太短，暂无纪要内\n"
```

### 读取详情、原文和纪要

```bash
node scripts/get_record_detail.js --id 6182954 --content-type meeting_summary
```

或使用 CLI：

```bash
itingnao get-detail --id 6182954 --content-type meeting_summary
```

### 手动触发非自动转写

当 `record/detail.status = 90` 时，表示该文件开启了非自动转写，需要手动调用接口开始生成原文：

```bash
node scripts/reset_handle.js --id 6182954
```

或使用 CLI：

```bash
itingnao reset-handle --id 6182954
```

### 追加一段纪要内容

```bash
node scripts/update_record.js --id 6182954 --append-meeting-summary "\n\n补充一句新内容"
```

### 直接替换原文第一句

```bash
node scripts/update_record.js --id 6383720 --replace-first-text "新的第一句原文"
```

### 在原文第一句后追加文本

```bash
node scripts/update_record.js --id 6383720 --append-first-text " [补充内容]"
```

---

## 更新能力速查

| 场景 | 命令 | 说明 |
|------|------|------|
| 更新文件名 | `node scripts/update_record.js --id 123456 --name "新标题"` | 直接更新基础字段 |
| 用完整原文数组覆盖 | `node scripts/update_record.js --id 6383720 --data-file "/absolute/path/data.json"` | 适合程序化更新整份原文 |
| 替换原文第一句 | `node scripts/update_record.js --id 6383720 --replace-first-text "新的第一句原文"` | 适合快速测试原文更新 |
| 追加原文第一句 | `node scripts/update_record.js --id 6383720 --append-first-text " [补充内容]"` | 脚本会自动读取旧原文后追加 |
| 用完整纪要覆盖 | `node scripts/update_record.js --id 6182954 --example-id 0 --meeting-summary "完整纪要正文"` | 适合你已拿到最终完整纪要 |
| 追加纪要内容 | `node scripts/update_record.js --id 6182954 --append-meeting-summary "\n\n补充一句新内容"` | 脚本会自动读取旧纪要后追加 |

补充说明：

- 原文快捷模式底层仍然是 `PUT /api/record/update`
- 纪要更新建议显式传 `--example-id`；追加模式未传时，脚本会自动读取当前记录的 `example_id`
- 原文的 `--data-file`、`--replace-first-text`、`--append-first-text` 互斥
- 纪要的 `--meeting-summary`、`--append-meeting-summary` 互斥

---

## 能力边界

- 支持本地音频/视频上传并创建转写任务
- 支持网络链接解析创建任务
- 支持读取原文、纪要、详情
- 原文来自 `record/detail.data`
- 纪要来自 `record/detail.meeting_summary`
- 主状态字段为 `record/detail.status`
- 原文状态字段为 `record/detail.data_status`
- `record/detail.status = 90`：开启了非自动转写，需要手动调用 `POST /api/record/reset_handle`
- 原文转写成功以 `record/detail.data_status = 1` 为准
- 纪要状态：
- `record/detail.meeting_summary_status = -2`：纪要生成中
- `record/detail.meeting_summary_status = -1`：纪要生成失败
- `record/detail.meeting_summary_status = 0`：纪要生成中
- `record/detail.meeting_summary_status = 1`：纪要生成中
- `record/detail.meeting_summary_status = 2`：纪要已生成成功
- 只支持按文件名搜索文件列表
- 当前不提供服务端全文检索文件内容
- 当前不自动完成短信登录，默认使用你已获取的 API Key

---

## 相关文件

- `SKILL.md`
- `references/auth.md`
- `references/transcribe.md`
- `references/file-read.md`
- `references/search.md`
- `references/update.md`
- `references/folder.md`
- `scripts/upload_media.js`
- `scripts/create_transcribe_task.js`
- `scripts/parse_network_url.js`
- `scripts/get_record_detail.js`
- `scripts/reset_handle.js`
- `scripts/update_record.js`

---

## License

MIT-0
