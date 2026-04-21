# 文件内容读取

## 概述

当前可读取：

- 文件详情
- 原文
- 纪要

---

## 1. 文件详情

```text
GET /api/record/detail
```

参考参数：

```json
{
  "id": 123456,
  "summary_new": "1",
  "content_type": "text"
}
```

说明：

- `id` 为文件 ID
- 详情接口通常包含文件基础信息、原文内容、转写状态、纪要内容等字段
- 从 `data` 字段读取原文内容
- 从 `meeting_summary` 字段读取纪要内容
- `status` 为主处理状态
- `data_status` 为原文转写状态
- `meeting_summary_status = 2` 表示纪要已生成完成

常用字段：

```json
{
  "id": 123456,
  "status": 4,
  "data_status": 1,
  "data": [
    {
      "id": 1,
      "text": "这是原文片段",
      "beginTime": 0,
      "endTime": 3200
    }
  ],
  "meeting_summary_status": 2,
  "meeting_summary": "这里是纪要内容"
}
```

状态判断（参考主项目详情页逻辑）：

- `status = 4`：文件处理完成
- `status = -2`：权益受限
- `status = 90`：开启了非自动转写，需手动调用 `reset_handle` 开始生成原文
- `status = 100`：文件解析失败
- `status ∈ [0, 1, 2, 11, 12, 101]`：处理中
- `data_status = 0`：原文转写中
- `data_status = 1`：原文转写成功
- `data_status = 2`：原文转写失败
- `meeting_summary_status = -2`：纪要生成中
- `meeting_summary_status = -1`：纪要生成失败
- `meeting_summary_status = 0`：纪要生成中
- `meeting_summary_status = 1`：纪要生成中
- `meeting_summary_status = 2`：纪要已生成成功

---

## 2. 纪要

纪要不再单独读取接口，统一从 `GET /api/record/detail` 的 `meeting_summary` 字段获取。

---

## 使用建议

- 优先先查 `record/detail`
- 判断 `meeting_summary_status` 是否为 `2`
- 若为 `2`，直接读取 `meeting_summary`
- 若未生成完成，可先走状态轮询接口，再回查 `record/detail`
- 原文、纪要数据默认返回API提供的原始数据，一定不要对原数据做二次加工，除非用户明确说继续总结）

---

## Node 脚本

```bash
node scripts/get_record_detail.js --id 6182954 --content-type meeting_summary
```

或使用 CLI：

```bash
itingnao get-detail --id 6182954 --content-type meeting_summary
```

返回结果会额外整理出：

- `detail.source.transcript = "detail.data"`
- `detail.status`：主状态的归一化结果
- `detail.transcript.status`：原文状态的归一化结果
- `detail.meetingSummary.status`：纪要状态的归一化结果
- `manualTriggerRequired = true`：表示当前需先手动调用 `reset_handle`
