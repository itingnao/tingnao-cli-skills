# 文件内容更新

## 概述

当前主要支持三类更新：

1. 更新文件基础内容
2. 更新原文内容
3. 更新纪要内容

---

## 1. 更新文件基础内容

```text
PUT /api/record/update
```

请求体按具体更新目标传入，例如文件标题、数据内容等。

参考示例：

```json
{
  "id": 123456,
  "name": "新的文件标题"
}
```

---

## 2. 更新原文内容

项目里原文编辑的主流程实际走：

```text
PUT /api/record/update
```

参考请求体：

```json
{
  "id": 123456,
  "data": [
    {
      "id": 1,
      "text": "更新后的原文内容"
    }
  ]
}
```

说明：

- `data` 需要传完整的原文段落数组，而不是只传一段纯文本
- 前端会先读取详情中的 `data`，再在原数组上修改对应段落后整体提交

---

## 2.1 `update_record.js` 的三种原文模式

### 模式一：传完整原文数组

```bash
node scripts/update_record.js --id 6383720 --data-file "/absolute/path/data.json"
```

### 模式二：直接替换第一句

适合做快速验证。脚本会先读取详情中的 `data`，然后只替换第一条的 `text`，再整体提交。

```bash
node scripts/update_record.js --id 6383720 --replace-first-text "新的第一句原文"
```

### 模式三：在第一句后追加文本

同样适合快速验证。脚本会先读取详情中的 `data`，在第一句 `text` 后追加你传入的内容，再整体提交。

```bash
node scripts/update_record.js --id 6383720 --append-first-text " [补充内容]"
```

说明：

- `--data-file`、`--replace-first-text`、`--append-first-text` 只能三选一
- 快捷模式底层仍然是 `PUT /api/record/update`，只是脚本帮你先读取再拼装完整 `data`

---

## 3. 更新原文转写优化稿

```text
POST /api/original_prompt/update_text_data_v2
```

参考请求体：

```json
{
  "id": 123456,
  "text_polish": "更新后的原文内容"
}
```

---

## 4. 更新纪要内容

项目里纪要的主要业务流程是“读取/重新生成”，但后端支持通过 `record/update` 直接修改纪要。你给出的有效参数形状是：

```text
PUT /api/record/update
```

参考请求体：

```json
{
  "id": 6182954,
  "example_id": 0,
  "meeting_summary": "全文内容太短，暂无纪要内\n"
}
```

说明：

- `id` 是文件 ID
- `example_id` 需要一起传，默认纪要可传 `0`
- `meeting_summary` 直接传完整纪要字符串

---

## 5. `update_record.js` 的两种纪要模式

### 模式一：传完整纪要

适合你已经拿到了最终完整纪要文本，想直接覆盖保存：

```bash
node scripts/update_record.js --id 6182954 --example-id 0 --meeting-summary "完整纪要正文"
```

### 模式二：只追加一段内容

适合你只想在原纪要后面补一句，脚本会自动：

1. 先读取当前详情
2. 取出已有 `meeting_summary`
3. 把新文本拼接到尾部
4. 再调用 `PUT /api/record/update`

```bash
node scripts/update_record.js --id 6182954 --append-meeting-summary "\n\n补充一句新内容"
```

说明：

- `--meeting-summary` 和 `--append-meeting-summary` 只能二选一
- 追加模式下，若不显式传 `--example-id`，脚本会先读取详情并使用当前记录的 `example_id`

---

## 使用建议

- 修改前先读取详情，确认目标文件和当前内容
- 原文更新建议保留必要上下文，避免整段误覆盖
- 纪要更新时显式传 `example_id`，避免和模板纪要上下文混淆
- 若只是想获取最新纪要，优先使用读取/重新生成流程，不要把“直接更新纪要”当作唯一来源
