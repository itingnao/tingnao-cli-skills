---
name: iTingnao
description: |
  iTingnao - 上传本地音频/视频并创建转写任务，查询状态，读取原文、纪要和文件详情。

  当以下情况时使用此 Skill：
  (1) 用户要上传本地音频或视频并发起转写
  (2) 用户要提交网络链接进行解析
  (3) 用户要查询文件处理状态、原文、纪要、详情
  (4) 用户要按文件名搜索文件
  (5) 用户要更新原文、纪要或处理文件夹操作
metadata: {"openclaw": {"requires": {}, "optionalEnv": ["ITINGNAO_API_KEY"], "baseUrl": "https://api.itingnao.com", "homepage": "https://itingnao.com"}}
---

# iTingnao Skill

## Agent 必读约束

### Base URL

固定使用：

```text
https://api.itingnao.com
```

### 认证

每次调用接口前，先检查：

- `ITINGNAO_API_KEY`

请求头：

- `Authorization: Bearer $ITINGNAO_API_KEY`
- `Content-Type: application/json;charset=UTF-8`

请求参数约定：

- 个人空间请求: 不传 `team_id`
- 团队空间请求: 通过脚本参数 `--team-id` 传入，脚本会写入请求参数 `team_id`
- 若用户未提供 `ITINGNAO_API_KEY`，提示其先配置 API Key，再继续后续请求

### 本地文件上传规则

当用户提供本地音频/视频路径时，不要直接把文件内容内联到对话中。应执行：

1. 调 `scripts/upload_media.js`
2. 如用户目标是发起转写，追加 `--create-task`
3. 返回 `record_id` 后，再按需查询状态或读取详情

### 搜索能力边界

当前只承诺：

- 按文件名搜索：`/api/record/list`

不要把详情页里的前端本地关键词高亮能力描述成服务端全文检索。

---

## 指令路由表

| 指令 | 角色 | 说明 | 详细文档 |
|------|------|------|---------|
| `/itingnao config` | 配置助手 | 检查 API Key 和 `--team-id` 参数 | [references/auth.md](references/auth.md) |
| `/itingnao transcribe` | 转写助手 | 上传本地音频/视频、提交链接、创建转写任务、轮询状态 | [references/transcribe.md](references/transcribe.md) |
| `/itingnao file` | 文件助手 | 读取详情、原文、纪要 | [references/file-read.md](references/file-read.md) |
| `/itingnao search` | 搜索助手 | 按文件名搜索文件列表 | [references/search.md](references/search.md) |
| `/itingnao update` | 编辑助手 | 更新原文、纪要或文件基础内容 | [references/update.md](references/update.md) |
| `/itingnao folder` | 文件夹助手 | 创建文件夹、移动文件到文件夹 | [references/folder.md](references/folder.md) |

---

## 自然语言路由

```text
包含本地音频/视频路径     -> /itingnao transcribe（本地上传）
包含网络链接          -> /itingnao transcribe（链接解析）
“查状态/进度/完成没”      -> /itingnao transcribe（轮询状态）
“看原文/纪要/详情”        -> /itingnao file
“搜索文件/找文件”         -> /itingnao search
“更新原文/修改纪要”       -> /itingnao update
“创建文件夹/移入文件夹”    -> /itingnao folder
“配置听脑/API Key”       -> /itingnao config
```

优先级：

1. 本地文件路径优先走上传脚本
2. 网络链接优先走链接解析
3. 已有 `file_path`/OSS key 时可直接创建任务

---

## 典型流程

### 1. 本地音频/视频上传并创建转写任务

```bash
node scripts/upload_media.js --file "/absolute/path/demo.mp3" --create-task --file-long "03:21"
```

完成后返回：

- `key`
- `ossUrl`
- `recordId`

### 2. 网络链接提交

调用：

```text
POST /api/record/parse_network_url
```

支持抖音、小红书、B站、快手、小宇宙等音视频链接，以及公众号、知乎、微博、36氪、公开网站链接。

也可直接执行：

```bash
node scripts/parse_network_url.js --url "https://v.douyin.com/xxxxx/"
```

### 3. 查询处理状态

调用：

```text
POST /api/record/list_by_record_id
```

### 4. 获取原文、纪要、详情

调用：

- `GET /api/record/detail`

说明：

- 原文统一从 `record/detail` 的 `data` 字段读取
- 纪要统一从 `record/detail` 的 `meeting_summary` 字段读取
- `status` 为主处理状态
- `data_status` 为原文状态
- `status = 90` 表示开启了非自动转写，需要手动调用 `POST /api/record/reset_handle`
- `data_status = 1` 表示原文转写成功
- `meeting_summary_status = -2` 表示纪要生成中
- `meeting_summary_status = -1` 表示纪要生成失败
- `meeting_summary_status = 0` 表示纪要生成中
- `meeting_summary_status = 1` 表示纪要生成中
- `meeting_summary_status = 2` 表示纪要已生成成功

---

## 常见错误处理

| 场景 | 处理方式 |
|------|---------|
| 未配置 `ITINGNAO_API_KEY` | 提示先配置 API Key |
| 本地文件不存在 | 立即停止并返回错误 |
| 上传签名获取失败 | 展示接口返回信息 |
| OSS 上传失败 | 返回 HTTP 状态码和响应体 |
| 创建任务失败 | 原样返回接口错误 |
| 搜索无结果 | 告知用户未找到匹配文件 |

---

## 脚本入口

- `scripts/upload_media.js`
- `scripts/create_transcribe_task.js`
- `scripts/parse_network_url.js`
- `scripts/get_record_detail.js`
- `scripts/reset_handle.js`
- `scripts/update_record.js`

使用前提：

- Node.js 18+
- 已配置 `ITINGNAO_API_KEY`

