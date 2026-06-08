# API 通信协议

> 更新：2026-05-31
> Base URL：`http://localhost:8000`

---

## 1. 认证

所有需要认证的接口在 HTTP Header 中携带：
```
Authorization: Bearer <JWT_TOKEN>
```

WebSocket 连接在 query string 中携带：
```
ws://localhost:8000/rooms/{room_id}/ws?token=<JWT_TOKEN>
```

---

## 2. HTTP API

### 2.1 认证 `/auth`

| 方法 | 路径 | 认证 | 请求体 | 响应 | 说明 |
|------|------|------|--------|------|------|
| POST | /auth/register | 无 | `{email, password, nickname}` | `{detail}` | 注册并发送验证码 |
| POST | /auth/verify | 无 | `{email, code}` | `{access_token, user_id, email, nickname}` | 验证邮箱，返回 JWT |
| POST | /auth/login | 无 | `{email, password}` | `{access_token, user_id, email, nickname}` | 登录，返回 JWT |
| GET | /auth/me | Bearer | — | `{id, email, nickname, is_verified}` | 获取当前用户信息 |

### 2.2 房间 `/rooms`

| 方法 | 路径 | 认证 | 请求体 | 响应 | 说明 |
|------|------|------|--------|------|------|
| GET | /rooms/my | Bearer | — | `[{...room, online_count, is_owner}]` | 我的房间列表 |
| GET | /rooms/{id} | 无 | — | `{...room, online_count}` | 房间详情 |
| POST | /rooms | Bearer | `{name, max_members}` | `RoomResponse` | 创建房间 |
| POST | /rooms/join | Bearer | `{invite_code}` | `RoomResponse` | 加入房间 |
| POST | /rooms/{id}/leave | Bearer | — | `{detail}` | 退出房间 |
| DELETE | /rooms/{id} | Bearer | — | `{detail}` | 删除房间（房主） |
| POST | /rooms/{id}/kick/{uid} | Bearer | — | `{detail}` | 踢出成员（房主） |
| GET | /rooms/{id}/members | 无 | — | `[{user_id, status, joined_at}]` | 成员列表 |

### 2.3 专注计时 `/focus`

| 方法 | 路径 | 认证 | 请求体 | 响应 | 说明 |
|------|------|------|--------|------|------|
| POST | /focus/report | Bearer | `{room_id, total_focus_seconds}` | `{detail}` | HTTP 上报专注时长（备用，主路径走 WebSocket） |
| GET | /focus/me | Bearer | — | `FocusSummaryResponse` | 个人专注总览（今日 + 本周 + 30 天历史） |

### 2.4 响应格式

**RoomResponse**：
```json
{
  "id": 1,
  "name": "深夜自习室",
  "invite_code": "aB3xY9",
  "max_members": 10,
  "owner_id": 1,
  "is_active": true,
  "created_at": "2026-05-27T18:43:35",
  "member_count": 3
}
```

**我的房间额外字段**：
```json
{
  "...roomResponse": {},
  "online_count": 2,
  "is_owner": true
}
```

**FocusSummaryResponse**（`GET /focus/me`）：
```json
{
  "today_minutes": 45,
  "week_minutes": 320,
  "daily": [
    {
      "date": "2026-05-31",
      "total_minutes": 45,
      "records": [
        { "room_id": 1, "minutes": 30 },
        { "room_id": 2, "minutes": 15 }
      ]
    },
    {
      "date": "2026-05-30",
      "total_minutes": 120,
      "records": [
        { "room_id": 1, "minutes": 120 }
      ]
    }
  ]
}
```

---

## 3. WebSocket 协议

### 3.1 连接

```
ws://localhost:8000/rooms/{room_id}/ws?token={JWT_TOKEN}
```

连接时验证：
1. Token 有效 → 提取 user_id
2. 房间存在
3. 用户是该房间成员 → 接受连接
4. 发送 `room_state`（已有成员列表）给新用户
5. 广播 `user_join` 给所有人

### 3.2 客户端 → 服务端

| type | 载荷 | 频率 | 说明 |
|------|------|------|------|
| `heartbeat` | `{ts: number}` | 每 10s | 维持在线 |
| `status_change` | `{status: "focusing"\|"away"}` | 有冷却 | 状态变更（10s 冷却） |
| `chat` | `{message: string}` | 无限 | 公屏消息 |
| `report_time` | `{action: "report_time", total_focus_seconds: number}` | 退出时 | 上报专注时长（持久化到 focus_records 表） |

### 3.3 服务端 → 客户端

| type | 载荷 | 目标 | 说明 |
|------|------|------|------|
| `room_state` | `{members: [{user_id, status}]}` | 单用户 | 初始成员列表（仅发给新连接） |
| `user_join` | `{user_id, status}` | 广播 | 有人加入 |
| `user_leave` | `{user_id, reason}` | 广播 | 有人离开（leave/kick/offline） |
| `user_status` | `{user_id, status}` | 广播 | 状态变更 |
| `chat` | `{user_id, message}` | 广播 | 聊天消息 |
| `room_deleted` | `{}` | 广播 | 房间被删除 |
| `kicked` | `{}` | 单用户 | 被踢出 |

### 3.4 连接关闭码

| 码 | 含义 |
|----|------|
| 1000 | 正常关闭 |
| 4001 | Token 无效 |
| 4003 | 不是房间成员 |
| 4004 | 房间不存在 |

---

## 4. 错误响应

所有 HTTP 错误统一格式：
```json
{
  "detail": "错误描述信息"
}
```

HTTP 状态码：400（业务错误）、401（未认证）、403（无权限）、404（不存在）、422（参数校验失败）
