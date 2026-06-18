# 互助SOS - 社区紧急求助平台

## 1. 产品概述

### 1.1 产品定位
一款社区互助紧急求助应用，让老年和残障人士在需要帮助时能够快速联系到附近的帮助者。

### 1.2 目标用户
| 角色 | 说明 |
|------|------|
| 求助者 | 老年人、残疾人（盲人、聋哑人、肢体残障、老年痴呆等） |
| 帮助者 | 注册并愿意提供帮助的用户 |
| 紧急联系人 | 求助者的家属，可查看求助者位置和追踪记录 |

> 注：一个用户可以同时拥有多个角色（如既是帮助者又是某人的紧急联系人），APP 内支持模式切换。

### 1.3 核心价值
- **一键求助**：极简操作，降低使用门槛
- **就近帮助**：基于地理位置，只通知附近帮助者
- **信息透明**：帮助者了解残障类型和原因，做好准备

---

## 2. 功能规格

### 2.1 用户角色与注册

#### 2.1.1 角色定义
- **求助者**：需要帮助的用户（老年/残障），包括老年痴呆患者。使用 APP 的「求助者模式」。
- **帮助者**：注册并开启"在线"状态的互助用户。使用 APP 的「帮助者/监护模式」。
- **紧急联系人**：被求助者授权可查看其位置的家属。使用 APP 的「帮助者/监护模式」下的监护面板。

> 设计原则：APP 不按角色拆分为多个独立应用，而是统一为一个 APP，内部通过**模式切换**承载不同角色的界面。求助者模式和帮助者/监护模式在注册后自动分流，后续可在设置中切换。

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

> 注册成功后，帮助者可在**设置页**自行添加固定位置计划（见 2.5.2.2），设置各时间段的位置信息。位置可随意填写（无需是真实地址），也可随时启用/关闭。未设置任何位置计划的帮助者不会被纳入求助筛选。

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
- 查询**5公里范围内**开启"在线"状态的帮助者（位置来源于固定位置计划，非实时GPS）
- 按距离排序，距离越近优先推送

#### 2.3.4 帮助者接单流程
```
1. 帮助者收到推送："附近有人需要帮助（盲人·摔倒·约300米）"
2. 点击查看详情：显示位置、地图、残障信息、原因
3. 选择"接单帮助"或"稍后再说"
4. 接单后：求助者收到"xxx要来帮助你"的推送
5. 帮助者可通过电话联系求助者
6. 求助者取消求助或30分钟后自动关闭
```

> 帮助者的位置来自固定位置计划匹配的常规位置（非实时GPS），距离为估算值。

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

### 2.5 帮助者位置与在线状态

#### 2.5.1 帮助者定位策略（固定位置计划）

**核心思路**：帮助者无需实时 GPS 定位，只需设置**固定时间段的常驻位置**，系统根据当前时间自动判断帮助者所在的常规位置，避免频繁获取 GPS 定位。

**设计理念**
```
不追踪"实时位置"，只记录"常规位置"
     ↓
帮助者填写：什么时间段，在什么地址
     ↓
系统根据当前时间自动匹配位置
     ↓
求助发生时，用匹配到的常规位置做距离筛选
```

**固定位置计划示例**
| 时间段 | 位置说明 | 地址 |
|--------|----------|------|
| 周一至周五 08:00-17:00 | 公司 | 北京市海淀区中关村大街1号 |
| 周一至周五 18:00-22:00 | 家 | 北京市朝阳区望京花园2号楼 |
| 周末 08:00-22:00 | 家 | 北京市朝阳区望京花园2号楼 |
| 每日 22:00-08:00 | 家（夜间休息） | 北京市朝阳区望京花园2号楼 |

**求助发生时的工作流程**
```
求助者发起SOS
       ↓
服务器获取当前时间（如：周一 14:30）
       ↓
查询所有在线帮助者 → 匹配每个帮助者当前时间段的位置计划
       ↓
得到每个帮助者的"当前常规位置"（经纬度 + 地址）
       ↓
计算与求助者的距离，筛选出 5km 范围内的帮助者
       ↓
向范围内的帮助者发送求救推送
       ↓
帮助者收到推送 "附近有人需要帮助（距离xx米）" + 接单按钮
       ↓
（可选）帮助者接单时可上传实时 GPS 验证距离，但不强制
       ↓
服务器可验证距离或直接锁定接单
```

**距离验证策略**
| 场景 | 距离来源 | 说明 |
|------|----------|------|
| 首次筛选 | 固定位置计划 | 根据当前时间自动匹配，无需 GPS |
| 接单确认（可选） | 实时 GPS | 帮助者接单时可选择上传实时位置验证距离，但不是必须的 |

**优点**
- 帮助者**零功耗**：无需任何后台定位服务
- 保护隐私：仅记录常规活动范围，不追踪实时行踪
- 无需复杂权限：不需要 `ACCESS_BACKGROUND_LOCATION`、`FOREGROUND_SERVICE` 等敏感权限
- 简单可靠：不依赖网络信号、GPS 信号等因素
- 数据稳定：位置不会因 GPS 漂移而突变

**注意事项**
- 固定位置是帮助者自行填写的"常规活动区域"并非"实时位置"，距离为估算值
- 帮助者可随时启用/关闭任意位置计划，关闭后该时段不参与求助筛选
- 未设置任何位置计划的帮助者不会被纳入求助筛选

#### 2.5.2 固定位置计划管理

##### 2.5.2.1 位置计划条目定义

每个位置计划条目包含以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 计划名称 | 用户自定义名称 | "工作时间"、"在家"、"夜间休息" |
| 适用日期 | 周一至周日（可多选） | 周一~周五 |
| 开始时间 | 该位置的起始时间 | 08:00 |
| 结束时间 | 该位置的结束时间 | 17:00 |
| 位置地址 | 文本地址描述 | 北京市海淀区中关村大街1号 |
| 纬度 | 地址对应的纬度（自动地理编码） | 39.9812 |
| 经度 | 地址对应的经度（自动地理编码） | 116.3110 |
| 是否启用 | 临时禁用某条计划 | 是/否 |

##### 2.5.2.2 如何设置位置计划

**设置时机**：注册成功后，在 APP 设置页中自主添加，可随时修改。

> **类比打车软件**：就像打车时你可以在地图上点选任何一个位置作为上车点——不一定是你家的位置，只是你方便的位置。帮助者设置位置计划也是同样的道理，只是多加了一个"时间段"维度。

**位置填写**：位置由帮助者**随意填写**，可以是：
- 真实的常住地址/工作地址（如果愿意）
- 虚构的地点（如"东城区商业区附近"）
- 模糊的场所名（如"望京"、"国贸商圈"）
- 任何文字描述，系统会自动转换为坐标

> 帮助者**没有义务**暴露自己的真实住址或行踪。位置仅用于估算与求助者之间的距离，帮助求助者判断等待时间。

**第一步建议**：新注册的帮助者建议设置至少 2 条计划覆盖全天：
1. 日间计划（如 08:00-18:00）：填写白天常活动的区域
2. 夜间计划（如 18:00-23:00）：填写晚上常在的区域

未设置任何计划的帮助者在求助筛选时不会被匹配到。

##### 2.5.2.3 位置匹配规则

系统查询帮助者当前位置时，按以下优先级匹配：

```
1. 取当前时间（星期几 + 时分）
2. 遍历该帮助者所有启用的位置计划
3. 找出满足条件的条目：
   a. 适用日期包含当前星期几
   b. start_time <= 当前时间 < end_time
4. 如果匹配到多条，取 start_time 离当前时间最近的（即最精确匹配）
5. 如果没有任何匹配 → 该帮助者在当前时间不可见（不参与求助筛选）
```

##### 2.5.2.4 跨天计划处理

当日结束时间跨越午夜的情况（如 22:00-08:00），拆分为两条：

| 存储形式 | 逻辑表示 |
|----------|----------|
| 22:00-23:59 | 夜间时段前半段 |
| 00:00-08:00 | 夜间时段后半段 |

系统自动处理拆分，用户只需选择时间段无需关心跨天问题。

##### 2.5.2.5 帮助者在线状态与计划启用

**两种控制维度**：

| 维度 | 控制方式 | 效果 |
|------|----------|------|
| 整体在线状态 | 顶部开关：在线/离线/忙碌 | 决定是否接收任何求助推送 |
| 单条计划启用 | 每条计划右侧开关：启用/关闭 | 决定该时段是否参与筛选 |

**交互方式**

```
整体状态 = 在线
  ├─ 计划1（08:00-17:00 东城区）→ 启用 ✓   → 当前时段参与筛选
  ├─ 计划2（18:00-22:00 望京）  → 启用 ✓   → 当前时段参与筛选
  └─ 计划3（22:00-08:00 家）    → 关闭 ✗   → 即使在线，该时段也不参与

整体状态 = 离线
  → 所有计划都不生效，不接收任何推送
```

**典型使用场景**
| 用户操作 | 含义 |
|----------|------|
| 关闭某条计划 | "这个时间段我忙，不能提供帮助" |
| 启用某条计划 | "这个时间段我有空，可以帮" |
| 整体切为离线 | "今天有事，全天不提供帮助" |
| 整体切为忙碌 | "在线但暂时不想接单，紧急情况可考虑我" |

**状态切换时的系统行为**
- 帮助者切换为"在线"时，系统自动按当前时间匹配启用中的计划，计算当前位置并缓存
- 帮助者切换为"离线"时，清除缓存位置，不参与任何求助筛选
- 帮助者启用/关闭某条计划后，如果当前正在该时段内，立即重新计算当前位置

### 2.8 隐私与权限

#### 2.8.1 求助者隐私控制
| 信息 | 默认 | 可调整 |
|------|------|--------|
| 位置 | 始终共享（求助必需） | - |
| 电话 | 不公开 | 每次求助手动开启 |
| 残障类型 | 公开 | 不可隐藏（帮助者需知情） |
| 残障详情 | 公开 | 不可隐藏 |

#### 2.8.2 位置权限
- **求助者**：首次求助时获取GPS权限
- **帮助者**：无需 GPS 权限（使用固定位置计划）
- **紧急联系人**：追踪请求经患者确认后获取位置

### 2.9 消息推送

#### 2.9.1 推送场景
| 场景 | 推送对象 | 消息格式 |
|------|----------|----------|
| 附近有求助 | 位置计划匹配范围内帮助者 | `{"type": "help_request", "help_id": "xxx"}` |
| 有人接单 | 求助者 | `{"type": "accepted", "helper_id": "xxx"}` |
| 求助被取消 | 已接单帮助者 | `{"type": "cancelled", "help_id": "xxx"}` |
| 位置追踪请求 | 被追踪的求助者 | `{"type": "track_request", "guardian_id": "xxx"}` |

#### 2.9.2 推送优先级策略
- `help_request`（求救信息）：高优先级，显示醒目通知
- 其他消息：普通优先级

---

## 3. 技术架构

### 3.1 技术选型

#### 移动端
- **框架**：Flutter 3.x（跨平台Android/iOS）
- **状态管理**：Provider / Riverpod
- **定位**：flutter_location（仅求助者获取实时GPS用）
- **地理编码**：地址转坐标（帮助者填写地址时自动转换）
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
  location_source VARCHAR(20), -- schedule=位置计划匹配 / manual=手动 / gps=实时GPS
  updated_at TIMESTAMP DEFAULT NOW()
);
```

> 帮助者的 `user_locations` 由系统根据**固定位置计划**自动计算并更新，无需 GPS 定位。求助者的 `user_locations` 在求助发起时通过 GPS 获取。

#### 帮助者固定位置计划表（helper_location_schedules）
```sql
CREATE TABLE helper_location_schedules (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(50) NOT NULL, -- 计划名称，如"工作时间"、"在家"
  day_of_week INTEGER NOT NULL, -- 适用星期：0=周日, 1=周一, ..., 6=周六（每条计划适用一天）
  start_time TIME NOT NULL, -- 开始时间
  end_time TIME NOT NULL, -- 结束时间
  latitude DOUBLE PRECISION NOT NULL, -- 该时间段所在的纬度
  longitude DOUBLE PRECISION NOT NULL, -- 该时间段所在的经度
  address VARCHAR(200) NOT NULL, -- 地址描述
  address_detail VARCHAR(200), -- 详细地址（楼号、门牌等）
  enabled BOOLEAN DEFAULT true, -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引：快速查询某用户在指定时间的位置
CREATE INDEX idx_schedules_user_time ON helper_location_schedules(user_id, day_of_week, start_time, end_time);
CREATE INDEX idx_schedules_enabled ON helper_location_schedules(user_id, enabled);
```

**数据示例**
| user_id | name | day_of_week | start_time | end_time | latitude | longitude | address |
|---------|------|-------------|-----------|---------|----------|-----------|---------|
| xxx | 工作时间 | 1 | 08:00 | 17:00 | 39.9812 | 116.3110 | 北京市海淀区中关村大街1号 |
| xxx | 工作时间 | 2 | 08:00 | 17:00 | 39.9812 | 116.3110 | 北京市海淀区中关村大街1号 |
| xxx | 在家 | 1 | 18:00 | 22:00 | 39.9812 | 116.3110 | 北京市朝阳区望京花园2号楼 |
| xxx | 在家休息 | 0 | 00:00 | 23:59 | 39.9812 | 116.3110 | 北京市朝阳区望京花园2号楼 |

> 设计说明：`day_of_week` 为单值（非数组），跨多天的同一条计划拆分为多条记录。这样设计查询效率最高，一条 SQL 即可查出当前时间匹配的位置。

#### 帮助者状态表（helper_status）
```sql
CREATE TABLE helper_status (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'offline', -- online/offline/busy
  current_plan_id UUID REFERENCES helper_location_schedules(id), -- 当前正在生效的位置计划ID
  current_latitude DOUBLE PRECISION, -- 当前计算出的位置（缓存）
  current_longitude DOUBLE PRECISION,
  current_address VARCHAR(200),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

> 帮助者切换为"在线"时，系统自动根据当前时间匹配位置计划，计算当前位置并缓存到 `current_latitude/current_longitude` 字段，避免每次查询都需重新匹配。

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
| `/api/user/location` | POST | 更新位置（求助者求实时GPS上报 / 帮助者手动更新） |

#### 位置上报接口详情

**请求参数**
```json
{
  "latitude": 39.9042,
  "longitude": 116.4074,
  "address": "北京市朝阳区xxx路",
  "source": "gps",    // gps=实时GPS / schedule=位置计划 / manual=手动
  "accuracy": 25.5    // GPS精度（米），仅source=gps时有效
}
```

**服务端处理逻辑**
1. 如果 `source=gps`：更新 `user_locations` 表中的坐标（求助者使用）
2. 如果 `source=schedule`：由系统自动根据位置计划计算后更新（帮助者使用）

#### 求助模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/help/request` | POST | 创建求助 |
| `/api/help/request/:id` | GET | 获取求助详情 |
| `/api/help/request/:id/cancel` | POST | 取消求助 |
| `/api/help/request/:id/accept` | POST | 接单 |
| `/api/help/nearby` | GET | 获取附近求助（帮助者用） |

#### 帮助者模块
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/helper/status` | PUT | 更新在线状态（切换为 online 时自动按当前时间匹配位置计划并缓存位置） |
| `/api/helper/history` | GET | 帮助历史 |
| `/api/helper/location-schedules` | GET | 获取我的所有位置计划 |
| `/api/helper/location-schedules` | POST | 新增位置计划条目 |
| `/api/helper/location-schedules/:id` | PUT | 更新位置计划条目 |
| `/api/helper/location-schedules/:id` | DELETE | 删除位置计划条目 |
| `/api/helper/location-schedules/recompute` | POST | 手动触发重新计算当前位置（基于已有计划） |

#### 位置计划接口详情

**新增位置计划**
```json
POST /api/helper/location-schedules
{
  "name": "工作时间",
  "day_of_week": [1, 2, 3, 4, 5],  // 适用星期：1=周一, 7=周日
  "start_time": "08:00",
  "end_time": "17:00",
  "latitude": 39.9812,
  "longitude": 116.3110,
  "address": "北京市海淀区中关村大街1号",
  "address_detail": "创新大厦A座15层"
}
```

**服务端处理逻辑**
1. 校验时间唯一性：同一天同一时间段不能有重叠的计划
2. 跨天时间段自动拆分（22:00-08:00 拆为 22:00-23:59 和 00:00-08:00 两条）
3. `day_of_week` 数组拆分为多条记录插入 `helper_location_schedules` 表
4. 新增完成后自动调 `recompute` 更新当前缓存位置

**重新计算当前位置**
```json
POST /api/helper/location-schedules/recompute
// 无需请求体，服务端根据当前时间匹配计划
// 返回当前匹配到的位置信息
```

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

由于帮助者使用**固定位置计划**而非实时 GPS，地理位置查询逻辑变为**单阶段直接查询**：

#### 查询逻辑

```
求助者发起SOS
       ↓
1. 获取当前时间（星期几 + 时分）
2. 查询所有"在线"状态的帮助者
3. 对每个帮助者，按当前时间匹配位置计划
4. 取匹配到的位置（current_latitude/current_longitude）
5. 计算与求助者之间的距离
6. 筛选出 5km 范围内的帮助者
7. 按距离排序推送
```

#### SQL 查询

```sql
-- 查询当前在线帮助者及其位置计划匹配后的位置
SELECT u.id, u.nickname,
       hs.current_latitude AS lat,
       hs.current_longitude AS lon,
       hs.current_address AS address,
       ST_Distance(
         ST_MakePoint(hs.current_longitude, hs.current_latitude)::geography,
         ST_MakePoint(:seeker_lon, :seeker_lat)::geography
       ) AS distance
FROM helper_status hs
JOIN users u ON hs.user_id = u.id
WHERE hs.status = 'online'
  AND hs.current_latitude IS NOT NULL
  AND ST_DWithin(
    ST_MakePoint(hs.current_longitude, hs.current_latitude)::geography,
    ST_MakePoint(:seeker_lon, :seeker_lat)::geography,
    5000 -- 5公里
  )
ORDER BY distance;
```

#### 位置计划匹配（服务端逻辑）

当帮助者切换为"在线"或手动触发 recompute 时，执行以下匹配逻辑：

```sql
-- 根据当前时间匹配位置计划
SELECT hls.*
FROM helper_location_schedules hls
WHERE hls.user_id = :helper_id
  AND hls.enabled = true
  AND hls.day_of_week = EXTRACT(DOW FROM NOW())
  AND hls.start_time <= CURRENT_TIME
  AND hls.end_time > CURRENT_TIME
ORDER BY hls.start_time DESC  -- 取最精确匹配（start_time最近的）
LIMIT 1;
```

**无匹配时的兜底策略**
- 如果上述查询返回空，尝试查找该用户"在家"名称的计划
- 如果仍然无匹配，该帮助者当前位置标记为 `NULL`，不在求助查询中出现


---

## 4. 页面结构

> 设计原则：一个 APP，两种模式，按角色动态呈现。公共页面统一复用，避免重复开发。

### 4.1 页面总览

```
┌──────────────────────────────────────────────────────┐
│                    公共页面（仅首次）                  │
│  启动页 → 权限引导页 → 注册页 → 模式分流              │
└──────────────┬───────────────────┬───────────────────┘
               │                   │
    ┌──────────▼──────┐   ┌───────▼──────────────────┐
    │   求助者模式      │   │   帮助者/监护模式          │
    │   (seeker)      │   │   (helper + guardian)    │
    │                 │   │                          │
    │  SOS 主页面      │   │  首页（地图 + 在线状态）    │
    │  求助确认页      │   │  求助列表页               │
    │  求助中页        │   │  求助详情页               │
    │  求助完成页      │   │  帮助历史页               │
    │                 │   │  位置计划设置页            │
    │                 │   │                          │
    │  ┌────────────┐ │   │  ┌────────────────────┐  │
    │  │ 追踪子模块  │ │   │  │ 监护面板（条件显示） │  │
    │  │（条件显示） │ │   │  │                    │  │
    │  │            │ │   │  │ 患者列表            │  │
    │  │ 后台运行状态 │ │   │  │ 追踪请求页          │  │
    │  │ 追踪确认弹窗 │ │   │  │ 追踪结果页          │  │
    │  │ 授权联系人  │ │   │  │ 追踪历史页          │  │
    │  │ 围栏设置    │ │   │  │ 电子围栏配置        │  │
    │  └────────────┘ │   │  └────────────────────┘  │
    │                 │   │                          │
    │  个人设置页      │   │  个人设置页 + 模式切换     │
    └─────────────────┘   └──────────────────────────┘
```

---

### 4.2 公共页面（所有角色共用）

| 页面 | 说明 | 出现时机 |
|------|------|----------|
| 启动页 | Logo + 品牌语，2秒自动跳转 | 首次安装 / 登出后 |
| 权限引导页 | 依次申请 GPS、通知、后台定位等权限 | 首次启动，未授权时 |
| 注册页 | 手机验证码登录 + 选择角色 + 填写基本信息 | 首次使用 |
| 个人设置页 | 个人信息、残障类型、紧急联系人管理、模式切换 | 随时可访问 |

---

### 4.3 求助者模式（seeker）

注册时选择角色为「求助者」后进入此模式。

#### 4.3.1 基础页面

| 页面 | 说明 |
|------|------|
| **SOS 主页面** | 巨大 SOS 按钮 + 摇一摇触发区域 + 语音唤醒状态指示 |
| 求助确认页 | 3秒倒计时确认 + 选择求助原因（摔倒/疾病/迷路/危险/其他） |
| 求助中页 | 实时显示"已通知 N 位附近帮助者"，等待接单 |
| 求助完成页 | 显示帮助者信息 + 感谢 + 评价 |

#### 4.3.2 追踪子模块（条件显示）

**显示条件**：`disability_type === '老年痴呆'` 且 `continuous_tracking === 1`（由家属开启）

| 界面 | 说明 |
|------|------|
| 后台运行状态栏 | SOS 主页面底部常驻条，显示"后台追踪运行中"或"追踪已暂停" |
| 追踪确认弹窗 | 家属请求位置时弹出，语音播报 + 大按钮「同意 / 拒绝」 |
| 已授权联系人 | 查看哪些家属有权追踪自己，可取消授权 |
| 围栏状态指示 | 当前是否在安全区域内，越界时醒目提示 |

> 这些界面不是独立页面，而是 SOS 主页面上的浮动组件 / 弹窗 / 底部区域，最大程度降低认知负担。

---

### 4.4 帮助者/监护模式（helper + guardian）

注册时选择角色为「帮助者」或「紧急联系人」后进入此模式。两者共用同一套主页框架，通过顶部 Tab 切换视角。

#### 4.4.1 基础页面（帮助者视角）

| 页面 | 说明 |
|------|------|
| **首页** | 地图视图 + 在线/离线/忙碌状态切换开关（切换为在线时自动计算当前位置） |
| 求助列表页 | 附近求助卡片列表，按距离排序，显示残障类型和原因摘要 |
| 求助详情页 | 地图标注求助者位置 + 残障信息 + 原因 + 接单按钮 |
| 帮助历史页 | 历史接单记录，按时间倒序 |
| **位置计划设置页** | 管理固定时间段-位置映射：添加/编辑/删除位置计划条目，查看当前生效位置 |

#### 4.4.2 监护面板（条件显示）

**显示条件**：用户存在至少一条 `guardian_relations` 绑定记录（即至少绑定了一位求助者）

首页顶部增加「监护」Tab，切换后显示：

| 页面 | 说明 |
|------|------|
| 患者列表 | 已绑定的求助者卡片，每张显示：昵称、残障类型、最近位置时间、快速追踪按钮 |
| 追踪请求页 | 选择患者 → 发起追踪 → 等待对方确认（含60秒超时提示） |
| 追踪结果页 | 地图显示患者实时位置 + 地址 + 更新时间 |
| 追踪历史页 | 最近7天轨迹地图 + 时间轴列表 |
| 电子围栏配置 | 设置安全区域中心点 + 半径 + 启用/禁用 |
| 越界警报记录 | 历史越界警报列表 |

---

### 4.5 模式切换

在个人设置页中提供模式切换入口：

- **求助者 ↔ 帮助者/监护**：用户可以手动切换当前模式，切换后界面整体变化
- 一个用户同时拥有多个角色身份时，切换无需重新登录
- 切换后保留之前的角色数据（帮助记录、追踪记录等互不影响）

---

### 4.6 页面数量对比

| 指标 | 原方案（四端） | 新方案（两端） |
|------|:-----------:|:-----------:|
| 独立页面总数 | 25 页 | 19 页 |
| 公共页面复用 | 无（每端重复3页） | 4 页公共 |
| 条件显示组件 | 0 | 10 个（弹窗/底部栏/Tab） |
| 重复页面 | 启动页×4、权限引导×4、注册×4 | 0 |

> 新方案减少 6 个独立页面，消除了 9 处重复，同时新增了**位置计划设置页**。

## 5. 特殊场景处理

### 5.1 网络异常
- 求助发起时无网络：提示"网络异常，求助失败"，可选择SMS发送（预留）

### 5.2 位置获取失败
- 求助者GPS信号弱：提示"无法获取位置，请到开阔地带重试"
- 帮助者地址信息无法转换为坐标：提示"地址格式有误，请重新填写"

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
- **帮助者**：使用固定位置计划，切换在线时自动计算；无需任何GPS获取
- **求助者**：求助发起时获取一次GPS位置
- **老年痴呆患者**：追踪确认后获取位置（被动模式）

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
