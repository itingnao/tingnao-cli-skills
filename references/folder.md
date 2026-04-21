# 文件夹操作

## 概述

当前支持：

1. 创建文件夹
2. 移动文件到文件夹

---

## 1. 创建文件夹

```text
POST /api/folder/edit_folder
```

创建时参考请求体：

```json
{
  "id": 0,
  "name": "新的文件夹",
  "status": 1
}
```

说明：

- 项目里创建文件夹的约定是 `id: 0`
- `status: 1` 表示正常创建/更新

---

## 2. 移动文件到文件夹

```text
POST /api/folder/move_folder
```

参考请求体：

```json
{
  "folder_id": 1001,
  "record_id_list": [123456, 123457],
  "operate_type": 1
}
```

说明：

- `operate_type: 1` 表示移入文件夹
- `operate_type: -1` 表示移出文件夹

---

## 使用建议

- 批量移动时优先合并成一次请求
- 移动前先确认目标 `folder_id` 和 `record_id_list`
