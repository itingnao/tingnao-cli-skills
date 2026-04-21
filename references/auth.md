# 听脑鉴权配置

## 概述

`itingnao` 不走独立 OAuth，需要提供：

- API Key

OpenClaw 中通过环境变量配置：

- `ITINGNAO_API_KEY`

---

## Base URL

- `https://api.itingnao.com`

---

## 请求头

```http
Authorization: Bearer {API_KEY}
Content-Type: application/json;charset=UTF-8
Accept: application/json, text/plain, */*
```

团队空间请求时，在请求参数里传 `team_id`：

```json
{
  "team_id": "xxx"
}
```

---

## OpenClaw 配置示例

```json
{
  "skills": {
    "entries": {
      "itingnao": {
        "env": {
          "ITINGNAO_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

---

## API Key 使用

直接使用已配置的 `ITINGNAO_API_KEY` 即可，无需额外登录流程。

---

## team_id 配置

按下面的规则传 `team_id`：

- 个人空间请求: 不传 `team_id`
- 团队空间请求: 通过脚本参数 `--team-id` 传入，脚本会写入请求参数 `team_id`

---

## 使用方式

- 先获取可用的 API Key
- 团队空间操作时，再额外传 `--team-id`
- 获取到 API Key 后，配置到 `ITINGNAO_API_KEY`
