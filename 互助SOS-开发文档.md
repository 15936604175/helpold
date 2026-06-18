# 互助SOS - 社区紧急求助平台

## 1. 产品概述

### 1.1 产品定位
一款社区互助紧急求助应用，让老年和残障人士在需要帮助时能够快速联系到附近的帮助者。

### 1.2 目标用户
| 角色 | 说明 |
|------|------|
| 求助者（父母） | 老年人、残疾人（盲人、聋哑人、肢体残障等） |
| 帮助者（子女） | 注册并愿意提供帮助的用户 |

### 1.3 核心价值
- **一键求助**：极简操作，降低使用门槛
- **就近帮助**：基于地理位置，只通知附近帮助者
- **信息透明**：帮助者了解残障类型和原因，做好准备

---

## 2. 功能规格

### 2.1 用户角色与注册

#### 2.1.1 角色定义
- **求助者**：需要帮助的用户（老年/残障）
- **帮助者**：注册并开启"在线"状态的互助用户
- **紧急联系人**：被求助者授权可查看其位置的家属（可与帮助者重叠）

#### 2.1.2 注册流程

**求助者注册：**
| 字段 | 说明 | 必填 |
|------|------|------|
| 手机号 | 唯一标识 | 是 |
| 昵称 | 显示名称 | 是 |
| 残障类型 | 盲人/聋哑/肢体/老年痴呆/其他/无 | 是 |
| 残障详情 | 具体说明（如：一级盲人、老年痴呆中期） | 否 |
| 紧急联系人 | 姓名+电话（可添加多位） | 是 |
| 是否公开电话 | 求助时默认不公开，可手动开启 | 是 |
| 位置授权 | 紧急联系人可查看我的位置（是/否） | 是 |

**紧急联系人注册：**
| 字段 | 说明 | 必填 |
|------|------|------|
| 手机号 | 唯一标识 | 是 |
| 昵称 | 显示名称 | 是 |
| 与求助者关系 | 子女/亲属/邻居/其他 | 是 |
| 真实姓名 | 核实身份 | 是 |

**帮助者注册：**
| 字段 | 说明 | 必填 |
|------|------|------|
| 手机号 | 唯一标识 | 是 |
| 昵称 | 显示名称 | 是 |
| 真实姓名 | 核实身份 | 是 |

### 2.2 求助触发方式

#### 2.2.1 触发方式列表
| 方式 | 适用人群 | 说明 |
|------|----------|------|
| 大按钮点击 | 所有人 | 屏幕上巨大SOS按钮 |
| 摇一摇 | 盲人/肢体残障 | 晃动手机触发 |
| 语音唤醒 | 盲人 | 说"救命"等关键词唤醒 |

#### 2.2.2 盲人专用模式
- 安装后首次设置，选择"我是盲人"
- 软件默认**后台运行**
- 摇一摇手机，系统语音询问："您需要帮助吗？说'是'确认，说'否'取消"
- 语音识别确认后，展示残障信息录入界面
- 整个流程支持语音操作

#### 2.2.3 误触防护
- SOS按钮触发后，需**3秒内再次点击确认**
- 摇一摇需**连续摇动3次**才触发
- 语音唤醒需说出**指定短语**

### 2.3 求助流程

#### 2.3.1 求助信息内容
```
{
  "求助者ID": "xxx",
  "求助者昵称": "张叔叔",
  "求助时间": "2024-01-15 10:30:00",
  "GPS坐标": {
    "纬度": 39.9042,
    "经度": 116.4074,
    "地址": "北京市朝阳区xxx路"
  },
  "残障信息": {
    "类型": "盲人",
    "详情": "一级盲人"
  },
  "求助原因": "摔倒无法起身",
  "紧急联系人": {
    "姓名": "张某",
    "电话": "138xxxx"
  },
  "是否公开电话": false
}
```

#### 2.3.2 求助原因快捷选项
| 选项 |
|------|
| 摔倒无法起身 |
| 突发疾病 |
| 迷路 |
| 遇到危险 |
| 其他（语音输入） |

#### 2.3.3 附近帮助者筛选
- 系统获取求助者GPS坐标
- 查询**2公里范围内**开启"在线"状态的帮助者
- 按距离排序，距离越近优先推送

#### 2.3.4 帮助者接单流程
```
1. 帮助者收到推送："附近有人需要帮助（盲人·摔倒）"
2. 点击查看详情：显示位置、地图、残障信息、原因
3. 选择"接单帮助"或"稍后再说"
4. 接单后：求助者收到"xxx要来帮助你"的推送
5. 帮助者可通过电话联系求助者
6. 求助者取消求助或30分钟后自动关闭
```

#### 2.3.5 其他帮助者状态
- 看到"已有人接单，位置已被锁定"
- 无法重复接单

### 2.4 位置追踪（老年痴呆患者）

#### 2.4.1 场景说明
针对老年痴呆症患者走失场景，紧急联系人需要**持续获取患者位置信息**，并在患者超出安全区域时收到提醒。

#### 2.4.2 追踪模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **持续追踪** | 按固定频率自动上报位置 | 重度失智患者，需要全天候监控 |
| **按需追踪** | 紧急联系人主动请求时获取 | 轻度患者，仅在需要时定位 |
| **混合模式** | 白天持续追踪 + 夜间按需追踪 | 中度患者，平衡功耗与安全 |

#### 2.4.3 持续追踪配置

**默认配置**（家属可调整）
| 参数 | 默认值 | 可调整范围 |
|------|--------|------------|
| 追踪频率 | 每10分钟 | 5分钟 - 60分钟 |
| 夜间时段 | 22:00 - 06:00 | 可自定义 |
| 夜间模式 | 关闭持续追踪 | 关闭/继续追踪 |
| 电子围栏半径 | 500米 | 100米 - 2000米 |

#### 2.4.4 工作流程（持续追踪模式）

```
【患者端（后台运行）】
       │
       ├──定时获取GPS（每10分钟）────────┐
       │                                 │
       ▼                                 │
  检查是否超出电子围栏                    │
       │                                 │
       ├──否──→ 静默上报位置 ────────────┤
       │                                 │
       └──是──→ 发送越界警报 ────────────┤
                                         ▼
                            【服务器】
                                 │
                                 ├──存储位置轨迹
                                 │
                                 ├──发送推送通知给紧急联系人
                                 │   "患者已离开安全区域"
                                 │
                                 └──发送短信通知（可选）
```

#### 2.4.5 工作流程（按需追踪模式）

```
紧急联系人              APP                  患者手机
     │                   │                      │
     ├──请求追踪────────>│                      │
     │                   ├──通知患者手机────────>│
     │                   │ "家属xxx正在请求您    │
     │                   │  的位置，是否同意？" │
     │                   │<──患者语音/按钮确认──│
     │                   │                      │
     │<──返回位置坐标────│                      │
     │                   │                      │
     ├──地图显示位置────>│                      │
     │                   │                      │
```

#### 2.4.6 患者端确认机制

| 患者类型 | 确认方式 | 持续追踪授权 |
|----------|----------|--------------|
| 老年痴呆（可交流） | 语音播报 + 大按钮确认 | 需要家属协助开启 |
| 盲人 | 语音确认（说"是"同意） | 需要家属协助开启 |
| 重度失智 | 自动同意（注册时由家属设置） | 默认开启 |

#### 2.4.7 电子围栏功能

**安全区域设置**
- 以患者家为中心设置圆形围栏
- 支持多边形自定义区域（高级功能）
- 围栏范围可随时调整

**越界警报触发**
1. 患者超出围栏边界
2. 连续2次定位都在围栏外（避免GPS漂移误报）
3. 发送推送+短信通知紧急联系人

**进入安全区域**
- 患者返回安全区域后发送"已回家"通知

#### 2.4.8 位置轨迹

**历史轨迹查看**
- 支持查看最近7天的位置记录
- 按时间轴显示移动路线
- 在地图上绘制移动轨迹

**轨迹数据保留**
- 保留最近30天数据
- 可手动导出轨迹数据
- 自动清理30天前的历史数据

#### 2.4.9 追踪记录

- 每次位置上报均记录日志
- 日志内容：时间、位置坐标、精度、电池电量、网络状态
- 家属可查看历史追踪记录

#### 2.4.10 隐私限制

- 持续追踪需**家属授权**（注册时设置）
- 紧急联系人**查看权限**：可查看实时位置和历史轨迹
- 位置数据**加密存储**，仅授权人员可访问

#### 2.4.11 功耗优化

| 优化措施 | 说明 |
|----------|------|
| 低功耗模式 | 夜间降低追踪频率 |
| 基站定位 | 室内优先使用基站定位 |
| 智能休眠 | 检测到静止超过30分钟后暂停追踪 |
| 电量保护 | 电量低于20%时自动关闭持续追踪 |

### 2.5 帮助者在线状态

| 状态 | 说明 |
|------|------|
| 在线 | 接收附近求助推送 |
| 离线 | 不接收推送 |
| 忙碌 | 接收推送但暂不接单 |

- 帮助者需手动切换在线/离线状态
- APP可常驻后台，切换状态不影响其他功能

#### 2.6.1 帮助者定位更新策略（定时上报 + 推送唤醒）

**核心思路**：平时定时上报保持"大致位置"，求救发生时推送唤醒获取"精确位置"

**平时（无求救时）**
| 操作 | 频率 | 说明 |
|------|------|------|
| 定时上报位置 | 每天2-4次（早8点、午12点、晚6点、睡前） | APP被定时任务唤醒，获取一次GPS然后上报 |
| 保存历史位置 | 每次上报后更新数据库 | 服务器保存用户最新位置快照 |
| 不持续追踪 | - | 不使用GPS持续定位，仅一次性获取 |

**求救发生时（两步推送流程）**
```
【阶段1：批量请求】
  求助者发起SOS
       ↓
  服务器用历史位置筛选："大致在5km范围内"的在线子女
       ↓
  向这些子女发送【高优先级推送】："附近有求助，请更新位置"
       ↓
  Android APP被推送唤醒
       ↓
  APP在后台临时启动定位服务（一次性，3-5秒完成）
       ↓
  获取GPS后立即上报服务器，然后释放GPS资源

【阶段2：精确筛选】
  服务器收到所有子女实时位置（30秒内完成收集）
       ↓
  精确计算距离，只对"真实距离<2km"的子女发送求救信息
       ↓
  范围内的子女看到："有人需要帮助（距离xx米）"+ 接单按钮

【阶段3：响应】
  子女点击"接单帮助" → 再次获取实时位置验证距离
       ↓
  服务器锁定接单者，通知求助者"有人来帮你了"
```

**超时与失败处理**
- 30秒内未上报位置的子女：标记为"不可用"，跳过推送
- 阶段2后超出范围的子女：不发送求救信息，仅静默处理
- 网络异常的子女：自动降级为"历史位置仅显示，不推送"

**Android 权限要求**
| 权限 | 用途 | 级别 |
|------|------|------|
| `ACCESS_FINE_LOCATION` | 精确定位 | 运行时申请 |
| `ACCESS_BACKGROUND_LOCATION` | 后台定位（Android 10+） | 运行时申请 |
| `INTERNET` | 网络通信 | 安装时自动授予 |
| `FOREGROUND_SERVICE` | 前台服务保活 | 安装时自动授予 |
| `WAKE_LOCK` | 防止CPU休眠 | 安装时自动授予 |
| `RECEIVE_BOOT_COMPLETED` | 开机自启动定时任务 | 安装时自动授予 |

**Android 实现要点**
- 使用 `WorkManager` 实现定时任务（省电、兼容各版本）
- 使用 `FusedLocationProviderClient` 获取一次性定位（非持续追踪）
- 推送消息使用高优先级（FCM priority=high / 极光推送 priority=2）
- 定位完成后立即释放GPS资源，避免耗电
- 推送消息格式：`{"type": "location_request", "help_id": "xxx"}`

**功耗评估**
- 每天2-4次一次性定位：约消耗1-2%电量
- 求救时临时定位：每次约3-5秒，可忽略不计
- 总体耗电远低于持续追踪方案

### 2.7 隐私与权限

#### 2.7.1 求助者隐私控制
| 信息 | 默认 | 可调整 |
|------|------|--------|
| 位置 | 始终共享（求助必需） | - |
| 电话 | 不公开 | 每次求助手动开启 |
| 残障类型 | 公开 | 不可隐藏（帮助者需知情） |
| 残障详情 | 公开 | 不可隐藏 |

#### 2.7.2 位置权限
- **求助者**：首次求助时获取GPS权限
- **帮助者**：接单后获取求助者精确位置
- **紧急联系人**：追踪请求经患者确认后获取位置

### 2.8 消息推送

#### 2.8.1 推送场景
| 场景 | 推送对象 | 消息格式 |
|------|----------|----------|
| 位置更新请求 | 历史位置在范围内的帮助者 | `{"type": "location_request", "help_id": "xxx"}` |
| 附近有求助 | 精确位置在范围内的帮助者 | `{"type": "help_request", "help_id": "xxx"}` |
| 有人接单 | 求助者 | `{"type": "accepted", "helper_id": "xxx"}` |
| 求助被取消 | 已接单帮助者 | `{"type": "cancelled", "help_id": "xxx"}` |
| 帮助者到达 | 求助者 | `{"type": "arrived", "helper_id": "xxx"}` |
| 位置追踪请求 | 被追踪的求助者 | `{"type": "track_request", "guardian_id": "xxx"}` |

#### 2.8.2 推送优先级策略
- `location_request`（位置更新请求）：高优先级（priority=high/2），穿透锁屏，后台可处理
- `help_request`（求救信息）：高优先级，显示醒目通知
- 其他消息：普通优先级

---

## 3. 技术架构

### 3.1 技术选型

#### 移动端
- **框架**：Flutter 3.x（跨平台Android/iOS）
- **状态管理**：Provider / Riverpod
- **定位**：flutter_location
- **摇一摇**：accelerometer_events
- **语音识别**：flutter_speech_recognition
- **消息推送**：极光推送 / FCM

#### 后端
- **语言**：Node.js / Python
- **框架**：Express / FastAPI
- **数据库**：PostgreSQL + PostGIS（地理位置）
- **缓存**：Redis（在线状态）
- **推送**：极光推送 Rest API

#### 实时通信
- **WebSocket**：求助状态实时同步
- **轮询**：作为WebSocket的降级方案

### 3.2 数据库设计

#### 用户表（users）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'seeker' / 'helper' / 'guardian'
  disability_type VARCHAR(50), -- 盲人/聋哑/肢体/老年痴呆/其他/无
  disability_detail VARCHAR(200),
  emergency_contact_name VARCHAR(50),
  emergency_contact_phone VARCHAR(20),
  share_phone BOOLEAN DEFAULT false,
  location_auth BOOLEAN DEFAULT true, -- 紧急联系人可查看位置
  auto_consent BOOLEAN DEFAULT false, -- 重度失智自动同意追踪
  continuous_tracking BOOLEAN DEFAULT false, -- 是否开启持续追踪
  tracking_interval INT DEFAULT 600, -- 追踪间隔（秒），默认10分钟
  geofence_radius INT DEFAULT 500, -- 电子围栏半径（米）
  night_mode_enabled BOOLEAN DEFAULT true, -- 是否启用夜间模式
  night_start_time TIME DEFAULT '22:00:00', -- 夜间开始时间
  night_end_time TIME DEFAULT '06:00:00', -- 夜间结束时间
  battery_threshold INT DEFAULT 20, -- 电量保护阈值（%）
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 紧急联系人关系表（guardian_relations）
```sql
CREATE TABLE guardian_relations (
  id UUID PRIMARY KEY,
  seeker_id UUID REFERENCES users(id),
  guardian_id UUID REFERENCES users(id),
  relation VARCHAR(20) NOT NULL, -- 子女/亲属/邻居/其他
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(seeker_id, guardian_id)
);
```

#### 地理位置表（user_locations）
```sql
CREATE TABLE user_locations (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address VARCHAR(200),
  location_source VARCHAR(20), -- scheduled/requested/manual 定时/推送请求/手动
  accuracy DOUBLE PRECISION, -- GPS精度（米）
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 帮助者状态表（helper_status）
```sql
CREATE TABLE helper_status (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'offline', -- online/offline/busy
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 求助记录表（help_requests）
```sql
CREATE TABLE help_requests (
  id UUID PRIMARY KEY,
  seeker_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address VARCHAR(200),
  disability_type VARCHAR(50),
  disability_detail VARCHAR(200),
  reason VARCHAR(500),
  share_phone BOOLEAN DEFAULT false,
  seeker_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending', -- pending/accepted/cancelled/resolved
  accepted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

#### 追踪记录表（location_tracking）
```sql
CREATE TABLE location_tracking (
  id UUID PRIMARY KEY,
  seeker_id UUID REFERENCES users(id),
  guardian_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/denied/timeout
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### 位置轨迹表（location_history）
```sql
CREATE TABLE location_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address VARCHAR(200),
  accuracy DOUBLE PRECISION, -- GPS精度（米）
  battery_level INT, -- 电量百分比
  network_type VARCHAR(20), -- wifi/cellular/none
  tracking_mode VARCHAR(20), -- continuous/scheduled/requested
  is_outside_geofence BOOLEAN DEFAULT false, -- 是否超出电子围栏
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 电子围栏表（geofence）
```sql
CREATE TABLE geofence (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL, -- 围栏中心点纬度
  longitude DOUBLE PRECISION NOT NULL, -- 围栏中心点经度
  radius INT NOT NULL DEFAULT 500, -- 围栏半径（米）
  enabled BOOLEAN DEFAULT true, -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 越界警报表（geofence_alerts）
```sql
CREATE TABLE geofence_alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL, -- 越界时的位置
  longitude DOUBLE PRECISION NOT NULL,
  alert_type VARCHAR(20) DEFAULT 'exit', -- exit=离开 / entry=进入
  notified BOOLEAN DEFAULT false, -- 是否已通知紧急联系人
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 API 接口

#### 用户模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 登录 |
| `/api/user/profile` | GET | 获取个人信息 |
| `/api/user/profile` | PUT | 更新个人信息 |
| `/api/user/location` | POST | 更新位置（定时上报/推送请求上报通用） |

#### 位置上报接口详情

**请求参数**
```json
{
  "latitude": 39.9042,
  "longitude": 116.4074,
  "address": "北京市朝阳区xxx路",
  "source": "scheduled",  // scheduled=定时上报 / requested=推送请求 / manual=手动
  "help_id": "xxx",        // source=requested时必填，对应的求助ID
  "accuracy": 25.5         // GPS精度（米）
}
```

**服务端处理逻辑**
1. 更新 `user_locations` 表中的坐标
2. 如果 `source=requested`，将此用户加入该 `help_id` 的"候选帮助者"临时列表
3. 30秒超时后，服务器对候选列表进行距离筛选，发送精确范围推送

#### 求助模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/help/request` | POST | 创建求助 |
| `/api/help/request/:id` | GET | 获取求助详情 |
| `/api/help/request/:id/cancel` | POST | 取消求助 |
| `/api/help/request/:id/accept` | POST | 接单（会再次验证距离） |
| `/api/help/nearby` | GET | 获取附近求助（帮助者用） |

#### 帮助者模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/helper/status` | PUT | 更新在线状态 |
| `/api/helper/history` | GET | 帮助历史 |

#### 位置追踪模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/track/request/:seeker_id` | POST | 请求追踪患者位置（按需追踪） |
| `/api/track/confirm/:tracking_id` | POST | 患者确认同意追踪 |
| `/api/track/deny/:tracking_id` | POST | 患者拒绝追踪 |
| `/api/track/history` | GET | 追踪历史记录（紧急联系人） |
| `/api/track/my-pending` | GET | 获取待确认的追踪请求（患者端） |
| `/api/track/config` | PUT | 更新持续追踪配置（家属端） |
| `/api/track/start` | POST | 开启持续追踪（患者端/家属端） |
| `/api/track/stop` | POST | 停止持续追踪（患者端/家属端） |
| `/api/track/realtime/:seeker_id` | GET | 获取患者实时位置（紧急联系人） |

#### 位置轨迹模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/history/track/:user_id` | GET | 获取位置轨迹（最近7天） |
| `/api/history/export/:user_id` | GET | 导出位置轨迹数据 |
| `/api/history/alerts/:user_id` | GET | 获取越界警报记录 |

#### 电子围栏模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/geofence/:user_id` | GET | 获取电子围栏配置 |
| `/api/geofence/:user_id` | PUT | 更新电子围栏配置 |
| `/api/geofence/:user_id/enable` | POST | 启用电子围栏 |
| `/api/geofence/:user_id/disable` | POST | 禁用电子围栏 |

### 3.4 地理位置查询

#### 阶段1：根据历史位置筛选（粗筛选）
```sql
-- 查找历史位置在5公里范围内的在线帮助者（粗筛选）
SELECT u.id, u.nickname, ul.latitude, ul.longitude,
       ST_Distance(
         ST_MakePoint(ul.longitude, ul.latitude)::geography,
         ST_MakePoint(116.4074, 39.9042)::geography
       ) as rough_distance
FROM users u
JOIN user_locations ul ON u.id = ul.user_id
JOIN helper_status hs ON u.id = hs.user_id
WHERE hs.status = 'online'
  AND u.role = 'helper'
  AND ST_DWithin(
    ST_MakePoint(ul.longitude, ul.latitude)::geography,
    ST_MakePoint(116.4074, 39.9042)::geography,
    5000 -- 5公里，粗筛选范围
  )
ORDER BY rough_distance;
```

#### 阶段2：根据实时位置筛选（精确筛选）
```sql
-- 帮助者实时上报位置后，筛选真实2公里内的用户
-- help_candidates 表存储阶段1中推送请求上报的实时位置
SELECT u.id, u.nickname, hc.latitude, hc.longitude,
       ST_Distance(
         ST_MakePoint(hc.longitude, hc.latitude)::geography,
         ST_MakePoint(116.4074, 39.9042)::geography
       ) as real_distance
FROM help_candidates hc
JOIN users u ON hc.helper_id = u.id
WHERE hc.help_id = 'xxx'
  AND hc.created_at > NOW() - INTERVAL '30 seconds'
  AND ST_DWithin(
    ST_MakePoint(hc.longitude, hc.latitude)::geography,
    ST_MakePoint(116.4074, 39.9042)::geography,
    2000 -- 2公里，精确范围
  )
ORDER BY real_distance;
```

#### 候选帮助者临时表（help_candidates）
```sql
CREATE TABLE help_candidates (
  id UUID PRIMARY KEY,
  help_id UUID REFERENCES help_requests(id),
  helper_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW()
);
```


---

## 4. 页面结构

### 4.1 求助者端（父母）

| 页面 | 说明 |
|------|------|
| 启动页 | Logo + 品牌语 |
| 权限引导页 | GPS、通知等权限申请 |
| 注册页 | 手机验证 + 基本信息 |
| 残障设置页 | 选择残障类型（首次设置） |
| **主页面（SOS页）** | 巨大SOS按钮 / 摇一摇区域 |
| 求助确认页 | 确认求助原因 |
| 求助中页 | 显示"已通知附近帮助者" |
| 求助完成页 | 感谢 + 本次帮助评价 |

### 4.2 帮助者端（子女）

| 页面 | 说明 |
|------|------|
| 启动页 | Logo + 品牌语 |
| 权限引导页 | GPS、通知等权限申请 |
| 注册页 | 手机验证 + 基本信息 |
| **首页** | 地图 + 在线状态切换 |
| 求助列表页 | 附近求助卡片列表 |
| 求助详情页 | 位置地图 + 残障信息 + 接单按钮 |
| 帮助历史页 | 历史帮助记录 |

### 4.3 紧急联系人端（家属）

| 页面 | 说明 |
|------|------|
| 启动页 | Logo + 品牌语 |
| 权限引导页 | GPS、通知等权限申请 |
| 注册页 | 手机验证 + 绑定患者 |
| **首页** | 患者列表 + 快速追踪按钮 |
| 追踪请求页 | 发起追踪 + 等待患者确认 |
| 追踪结果页 | 显示患者位置 + 地图 |
| 追踪历史页 | 历史追踪记录 |

### 4.4 患者端（老年痴呆患者）

| 页面 | 说明 |
|------|------|
| 被动运行 | 无主动界面，后台监听追踪请求 |
| 追踪确认页 | 收到追踪请求时弹出，语音+大按钮确认 |
| 设置页 | 查看已授权的紧急联系人 |

---

## 5. 特殊场景处理

### 5.1 网络异常
- 求助发起时无网络：提示"网络异常，求助失败"，可选择SMS发送（预留）

### 5.2 位置获取失败
- GPS信号弱：提示"无法获取位置，请到开阔地带重试"

### 5.3 无人接单
- 30分钟内无人接单：提示"暂无人响应，已通知紧急联系人"

### 5.4 求助者取消
- 帮助者已出发但求助者取消：推送通知给帮助者

### 5.5 重复求助
- 同一用户5分钟内不能发起第二次求助

### 5.6 追踪相关

#### 5.6.1 追踪请求超时
- 患者端60秒内未响应：自动标记为超时，通知紧急联系人

#### 5.6.2 追踪频率限制
- 同一紧急联系人对同一患者：每日最多10次，最小间隔30分钟
- 超过限制时提示："今日追踪次数已用完，请明天再试"

#### 5.6.3 患者拒绝追踪
- 患者选择拒绝时，通知紧急联系人："对方拒绝了位置分享"

#### 5.6.4 患者手机关机/无网络
- 无法建立连接时，通知紧急联系人："无法获取位置，患者可能处于离线状态"

---

## 6. 性能与续航

### 6.1 后台保活
- 使用前台Service保持APP在线
- 心跳机制维持WebSocket连接

### 6.2 位置更新策略
- 帮助者：接单时更新位置
- 求助者：求助发起时获取位置
- 老年痴呆患者：追踪确认后获取位置（被动模式）

### 6.3 功耗优化
- 不使用持续GPS追踪
- WebSocket长连接代替频繁轮询
- 追踪模式下获取位置后立即释放GPS

---

## 7. 后续迭代建议

### 7.1 MVP版本（本期）
- 基础注册登录
- SOS按钮 + 摇一摇触发
- 附近帮助者推送
- 接单响应机制
- 位置追踪（老年痴呆患者）

### 7.2 V2.0
- 语音识别增强
- 拨打紧急联系人
- 帮助者认证体系
- 追踪历史查看

### 7.3 V3.0
- 社区志愿者接入
- 求助趋势大数据分析
- 医院/救援机构对接
- 老人防走丢电子围栏
