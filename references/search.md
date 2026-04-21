# 文件搜索

## 概述

当前 Skill 只支持按文件名搜索文件列表。

不承诺：

- 服务端全文检索原文内容
- 服务端全文检索纪要内容

---

## 文件列表名搜索

```text
GET /api/record/list
```

参考参数：

```json
{
  "page": 1,
  "size": 20,
  "record_name": "产品会议"
}
```

可选参数：

- `folder_id`
- `meeting_summary_status`
- `exclude_folder_id`
- `source`
- `sortby`
- `file_type`

---

## 返回结果处理建议

- 如果命中多个文件，优先展示文件名、时长、更新时间
- 如果没有结果，明确告诉用户未找到匹配文件
