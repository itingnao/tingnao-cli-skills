# 转写与生成

## 概述

当前支持三条主链路：

1. 本地音频/视频上传到 OSS，再创建转写任务
2. 网络链接解析
3. 查询任务状态与生成结果

---

## 1. 本地音频/视频上传

### 第一步：获取上传签名

```text
GET /api/common/sign?oss_dir={oss_dir}
```

返回结果中的关键字段：

- `host`
- `dir`
- `policy`
- `accessid`
- `signature`

### 第二步：上传到 OSS

按项目现有实现，上传表单字段为：

```text
key
policy
OSSAccessKeyId
success_action_status=200
signature
name
file
```

其中：

- `key = sign.data.dir + 随机文件名 + 扩展名`
- `name = 原始文件名`

### 第三步：创建转写任务

```text
POST /api/record/create
```

参考请求体：

```json
{
  "trans_type": 1,
  "chat_num": 1,
  "style": 2,
  "file_source_type": 1,
  "name": "demo.mp3",
  "file_path": "record/demo.mp3",
  "file_long": "03:21",
  "scene_id": 1,
  "source_channel": 2,
  "file_oss_source": 0
}
```

字段说明：

- `style`: 视频 `1`，音频 `2`
- `file_path`: OSS key
- `file_long`: 文件时长字符串，建议格式 `mm:ss` 或 `hh:mm:ss`
- `file_oss_source`: 默认 `0`

---

## 2. 网络链接解析

```text
POST /api/record/parse_network_url
```

参考请求体：

```json
{
  "url": [
    "https://v.douyin.com/xxxxx/"
  ],
  "language": 1
}
```

说明：

- 支持抖音、小红书、B站、快手、小宇宙等音视频链接，以及公众号、知乎、微博、36氪、公开网站链接
- 仍会复用当前 API Key 和可选 `team_id`

Node 脚本：

```bash
node scripts/parse_network_url.js --url "https://v.douyin.com/xxxxx/"
```

---

## 3. 查询处理状态

```text
POST /api/record/list_by_record_id
```

参考请求体：

```json
{
  "id": [123456]
}
```

建议轮询策略：

- 30 秒查询一次
- 遇到处理中状态时继续轮询
- 若 `record/detail.status = 90`，表示该文件开启了非自动转写，需要先手动触发转写
- 成功后再读取 `record/detail`

### `status = 90` 的处理

外层项目实际逻辑：

- `status = 90` 不是“纪要生成中”
- 它表示该文件开启了非自动转写，当前还未自动生成原文
- 需要主动调用手动触发接口

接口：

```text
POST /api/record/reset_handle
```

参考请求体：

```json
{
  "id": 123456,
  "privilege_type": 1
}
```

说明：

- `id`：文件 ID
- `privilege_type`：外层项目当前统一传 `1`
- 团队空间请求时，`team_id` 会随请求体一起传递

Node 脚本：

```bash
node scripts/reset_handle.js --id 123456
```

或使用 CLI：

```bash
itingnao reset-handle --id 123456
```

---

## 4. 获取处理结果

### 获取纪要

```text
GET /api/record/detail?id={record_id}
```

说明：

- 从返回结果里的 `data` 字段读取原文内容
- 从返回结果里的 `meeting_summary` 字段读取纪要内容
- `status` 为主处理状态
- `data_status` 为原文状态
- `data_status = 1` 表示原文转写成功
- `meeting_summary_status = -2` 表示纪要生成中
- `meeting_summary_status = -1` 表示纪要生成失败
- `meeting_summary_status = 0` 表示纪要生成中
- `meeting_summary_status = 1` 表示纪要生成中
- `meeting_summary_status = 2` 表示纪要已生成成功
- 若 `meeting_summary_status` 不是 `2`，继续轮询状态后再读取 `record/detail`

---

## Node 脚本

### 本地上传并可选建任务

```bash
node scripts/upload_media.js --file "/absolute/path/demo.mp3" --create-task --file-long "03:21"
```

### 仅创建任务

```bash
node scripts/create_transcribe_task.js --file-path "record/demo.mp3" --name "demo.mp3" --style audio --file-long "03:21"
```
