const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');
const JWT_SECRET = 'mutual-sos-secret-key-2024';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- 数据库（JSON 文件） ----------
const dbFiles = {
  users: 'users.json',
  userLocations: 'user_locations.json',
  helperStatus: 'helper_status.json',
  helpRequests: 'help_requests.json',
  helpCandidates: 'help_candidates.json',
  guardianRelations: 'guardian_relations.json',
  locationTracking: 'location_tracking.json',
  locationHistory: 'location_history.json',
  geofence: 'geofence.json',
  geofenceAlerts: 'geofence_alerts.json',
  pushNotifications: 'push_notifications.json'
};

function loadDb(name) {
  const file = path.join(DATA_DIR, dbFiles[name]);
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch (e) { return []; }
}

function saveDb(name, data) {
  const file = path.join(DATA_DIR, dbFiles[name]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// 初始化数据
for (const key of Object.keys(dbFiles)) {
  const file = path.join(DATA_DIR, dbFiles[key]);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
}

// ---------- 工具函数 ----------
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Haversine 公式计算距离（米）
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 简单密码哈希（SHA-256）
function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

// JWT (简化版)
function encodeJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64');
  return header + '.' + body + '.' + sig;
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(parts[0] + '.' + parts[1]).digest('base64');
    if (sig !== parts[2]) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64').toString());
  } catch (e) { return null; }
}

function now() { return new Date().toISOString(); }

// ---------- 路由处理 ----------
const routes = {
  // 用户认证
  'POST /api/auth/register': registerUser,
  'POST /api/auth/login': loginUser,
  'GET /api/user/profile': getProfile,
  'PUT /api/user/profile': updateProfile,

  // 位置上报
  'POST /api/user/location': updateLocation,
  'PUT /api/helper/status': updateHelperStatus,
  'POST /api/guardian/bind': bindGuardian,

  // 推送通知
  'GET /api/notifications/:userId': getNotifications,
  'POST /api/notifications/clear/:userId': clearNotifications,

  // SOS 求助
  'POST /api/help/request': createHelpRequest,
  'POST /api/help/filter-complete/:helpId': filterComplete,
  'GET /api/help/request/:id': getHelpRequest,
  'POST /api/help/request/:id/cancel': cancelHelp,
  'POST /api/help/request/:id/accept': acceptHelp,
  'GET /api/help/nearby': getNearbyHelp,

  // 追踪
  'POST /api/track/request/:seekerId': requestTracking,
  'POST /api/track/confirm/:trackingId': confirmTracking,
  'POST /api/track/deny/:trackingId': denyTracking,
  'GET /api/track/realtime/:seekerId': getRealtimeLocation,
  'PUT /api/track/config': updateTrackingConfig,
  'POST /api/track/start': startTracking,
  'POST /api/track/stop': stopTracking,
  'GET /api/track/my-pending': getPendingTracking,
  'GET /api/track/history': getGuardianTrackingHistory,

  // 电子围栏
  'GET /api/geofence/:userId': getGeofence,
  'PUT /api/geofence/:userId': updateGeofence,
  'POST /api/geofence/:userId/enable': enableGeofence,
  'POST /api/geofence/:userId/disable': disableGeofence,

  // 历史
  'GET /api/history/track/:userId': getLocationHistory,
  'GET /api/history/alerts/:userId': getAlerts,

  // 统计
  'GET /api/stats': getStats,
  'GET /health': healthCheck
};

// ---------- 请求处理辅助 ----------
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { resolve({}); }
    });
  });
}

function sendJson(res, data, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
  res.end(JSON.stringify(data));
}

function parseAuth(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  return decodeJWT(token);
}

function checkGeofence(userId, lat, lon) {
  const fences = loadDb('geofence');
  const fence = fences.find(f => f.user_id === userId && f.enabled !== false);
  if (!fence) return false;
  const dist = distance(lat, lon, fence.latitude, fence.longitude);
  if (dist > fence.radius) {
    const alerts = loadDb('geofenceAlerts');
    alerts.push({
      id: uuid(), user_id: userId, latitude: lat, longitude: lon,
      alert_type: 'exit', notified: true, created_at: now()
    });
    saveDb('geofenceAlerts', alerts);
    return true;
  }
  return false;
}

// ---------- 业务逻辑 ----------
function registerUser(req, res, body) {
  const users = loadDb('users');
  const { phone, password, nickname, role, disability_type, disability_detail, emergency_contact_name, emergency_contact_phone, location_auth, auto_consent } = body;
  if (!phone || !password || !nickname || !role) return sendJson(res, { success: false, error: '缺少必填字段' }, 400);
  if (!['seeker', 'helper', 'guardian'].includes(role)) return sendJson(res, { success: false, error: '角色无效' }, 400);
  if (users.find(u => u.phone === phone)) return sendJson(res, { success: false, error: '手机号已注册' }, 400);
  const id = uuid();
  const user = {
    id, phone, nickname, password: hashPassword(password), role,
    disability_type: disability_type || null, disability_detail: disability_detail || null,
    emergency_contact_name: emergency_contact_name || null, emergency_contact_phone: emergency_contact_phone || null,
    share_phone: 0, location_auth: location_auth ? 1 : 1, auto_consent: auto_consent ? 1 : 0,
    continuous_tracking: 0, tracking_interval: 600, geofence_radius: 500,
    night_mode_enabled: 1, night_start_time: '22:00:00', night_end_time: '06:00:00',
    battery_threshold: 20, created_at: now()
  };
  users.push(user);
  saveDb('users', users);

  // 初始化位置和围栏
  if (role === 'seeker') {
    const fences = loadDb('geofence');
    fences.push({ id: uuid(), user_id: id, latitude: 39.9042, longitude: 116.4074, radius: 1000, enabled: 1, created_at: now(), updated_at: now() });
    saveDb('geofence', fences);
    const locs = loadDb('userLocations');
    locs.push({ user_id: id, latitude: 39.9042, longitude: 116.4074, address: '默认位置', location_source: 'init', accuracy: 100, updated_at: now() });
    saveDb('userLocations', locs);
  }
  if (role === 'helper') {
    const status = loadDb('helperStatus');
    status.push({ user_id: id, status: 'online', updated_at: now() });
    saveDb('helperStatus', status);
    const locs = loadDb('userLocations');
    locs.push({ user_id: id, latitude: 39.91, longitude: 116.41, address: '帮助者位置', location_source: 'init', accuracy: 50, updated_at: now() });
    saveDb('userLocations', locs);
  }

  const token = encodeJWT({ id, phone, role });
  delete user.password;
  sendJson(res, { success: true, token, user });
}

function loginUser(req, res, body) {
  const { phone, password } = body;
  if (!phone || !password) return sendJson(res, { success: false, error: '缺少字段' }, 400);
  const users = loadDb('users');
  const user = users.find(u => u.phone === phone);
  if (!user) return sendJson(res, { success: false, error: '用户不存在' }, 401);
  if (user.password !== hashPassword(password)) return sendJson(res, { success: false, error: '密码错误' }, 401);
  const token = encodeJWT({ id: user.id, phone: user.phone, role: user.role });
  delete user.password;
  sendJson(res, { success: true, token, user });
}

function getProfile(req, res) {
  const auth = parseAuth(req);
  if (!auth) return sendJson(res, { success: false, error: '未登录' }, 401);
  const users = loadDb('users');
  const user = users.find(u => u.id === auth.id);
  if (!user) return sendJson(res, { success: false, error: '用户不存在' }, 404);
  delete user.password;
  sendJson(res, { success: true, user });
}

function updateProfile(req, res, body) {
  const auth = parseAuth(req);
  if (!auth) return sendJson(res, { success: false, error: '未登录' }, 401);
  const users = loadDb('users');
  const idx = users.findIndex(u => u.id === auth.id);
  if (idx < 0) return sendJson(res, { success: false, error: '用户不存在' }, 404);
  const u = users[idx];
  if (body.nickname) u.nickname = body.nickname;
  if (body.disability_type) u.disability_type = body.disability_type;
  if (body.continuous_tracking !== undefined) u.continuous_tracking = body.continuous_tracking ? 1 : 0;
  if (body.tracking_interval) u.tracking_interval = body.tracking_interval;
  if (body.geofence_radius) u.geofence_radius = body.geofence_radius;
  if (body.auto_consent !== undefined) u.auto_consent = body.auto_consent ? 1 : 0;
  users[idx] = u;
  saveDb('users', users);
  sendJson(res, { success: true });
}

function updateLocation(req, res, body) {
  const auth = parseAuth(req);
  const userId = (auth && auth.id) || body.user_id || ('anon-' + Date.now());
  const { latitude, longitude, address, source, help_id, accuracy } = body;
  if (latitude == null || longitude == null) return sendJson(res, { success: false, error: '缺少坐标' }, 400);
  const locs = loadDb('userLocations');
  const idx = locs.findIndex(l => l.user_id === userId);
  if (idx >= 0) {
    locs[idx] = { user_id: userId, latitude, longitude, address: address || null, location_source: source || 'manual', accuracy: accuracy || 25, updated_at: now() };
  } else {
    locs.push({ user_id: userId, latitude, longitude, address: address || null, location_source: source || 'manual', accuracy: accuracy || 25, updated_at: now() });
  }
  saveDb('userLocations', locs);
  const outside = checkGeofence(userId, latitude, longitude);
  const history = loadDb('locationHistory');
  history.push({ id: uuid(), user_id: userId, latitude, longitude, address: address || null, accuracy: accuracy || 25, tracking_mode: source || 'manual', is_outside_geofence: outside ? 1 : 0, created_at: now() });
  saveDb('locationHistory', history);
  if (source === 'requested' && help_id) {
    const candidates = loadDb('helpCandidates');
    candidates.push({ id: uuid(), help_id, helper_id: userId, latitude, longitude, accuracy: accuracy || 25, created_at: now() });
    saveDb('helpCandidates', candidates);
  }
  sendJson(res, { success: true, outside_fence: outside, location: { user_id: userId, latitude, longitude } });
}

function updateHelperStatus(req, res, body) {
  const auth = parseAuth(req);
  if (!auth) return sendJson(res, { success: false, error: '未登录' }, 401);
  const status = loadDb('helperStatus');
  const idx = status.findIndex(s => s.user_id === auth.id);
  if (idx >= 0) { status[idx].status = body.status || 'online'; status[idx].updated_at = now(); }
  else { status.push({ user_id: auth.id, status: body.status || 'online', updated_at: now() }); }
  saveDb('helperStatus', status);
  sendJson(res, { success: true, status: body.status });
}

function bindGuardian(req, res, body) {
  const auth = parseAuth(req);
  if (!auth) return sendJson(res, { success: false, error: '未登录' }, 401);
  const { seeker_phone, relation } = body;
  const users = loadDb('users');
  const seeker = users.find(u => u.phone === seeker_phone);
  if (!seeker) return sendJson(res, { success: false, error: '患者不存在' }, 404);
  const relations = loadDb('guardianRelations');
  const existing = relations.find(r => r.seeker_id === seeker.id && r.guardian_id === auth.id);
  if (!existing) {
    relations.push({ id: uuid(), seeker_id: seeker.id, guardian_id: auth.id, relation: relation || '子女', created_at: now() });
    saveDb('guardianRelations', relations);
  }
  sendJson(res, { success: true, seeker_id: seeker.id, seeker_nickname: seeker.nickname });
}

function getNotifications(req, res) {
  const all = loadDb('pushNotifications');
  const items = all.filter(n => n.recipient_id === req.params.userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
  sendJson(res, { success: true, notifications: items });
}

function clearNotifications(req, res) {
  const all = loadDb('pushNotifications');
  saveDb('pushNotifications', all.filter(n => n.recipient_id !== req.params.userId));
  sendJson(res, { success: true });
}

function createHelpRequest(req, res, body) {
  const { seeker_id, latitude, longitude, address, reason, disability_type, disability_detail, share_phone, seeker_phone } = body;
  if (!seeker_id || latitude == null || longitude == null) return sendJson(res, { success: false, error: '缺少必要参数' }, 400);
  const helpId = uuid();
  const requests = loadDb('helpRequests');
  requests.push({
    id: helpId, seeker_id, latitude, longitude, address: address || null,
    disability_type: disability_type || null, disability_detail: disability_detail || null,
    reason: reason || '紧急求助', share_phone: share_phone ? 1 : 0, seeker_phone: seeker_phone || null,
    status: 'pending', stage: 'filtering', accepted_by: null, created_at: now(), resolved_at: null
  });
  saveDb('helpRequests', requests);

  // 阶段1：筛选5km内在线帮助者
  const locs = loadDb('userLocations');
  const statuses = loadDb('helperStatus');
  const users = loadDb('users');
  const candidates = [];
  for (const s of statuses) {
    if (s.status !== 'online') continue;
    const loc = locs.find(l => l.user_id === s.user_id);
    if (!loc) continue;
    const user = users.find(u => u.id === s.user_id);
    if (!user || user.role !== 'helper') continue;
    const dist = distance(latitude, longitude, loc.latitude, loc.longitude);
    if (dist < 5000) candidates.push({ id: s.user_id, nickname: user.nickname, distance: dist });
  }
  // 记录推送通知
  const notifications = loadDb('pushNotifications');
  for (const c of candidates) {
    notifications.push({
      id: uuid(), recipient_id: c.id, type: 'location_request',
      title: '附近有人需要帮助', body: '请上报您的位置',
      data: JSON.stringify({ help_id: helpId, seeker_lat: latitude, seeker_lon: longitude }),
      status: 'pending', created_at: now()
    });
  }
  saveDb('pushNotifications', notifications);
  sendJson(res, { success: true, help_id: helpId, candidates_count: candidates.length, stage: 'filtering' });
}

function filterComplete(req, res) {
  const helpId = req.params.helpId;
  const requests = loadDb('helpRequests');
  const hr = requests.find(r => r.id === helpId);
  if (!hr) return sendJson(res, { success: false, error: '求助不存在' }, 404);
  const candidates = loadDb('helpCandidates').filter(c => c.help_id === helpId);
  const users = loadDb('users');
  const notifications = loadDb('pushNotifications');
  const filtered = [];
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  for (const c of candidates) {
    if (new Date(c.created_at).getTime() < fiveMinAgo) continue;
    const dist = distance(hr.latitude, hr.longitude, c.latitude, c.longitude);
    if (dist < 2000) {
      const user = users.find(u => u.id === c.helper_id);
      filtered.push({ helper_id: c.helper_id, nickname: user ? user.nickname : null, distance: dist });
      notifications.push({
        id: uuid(), recipient_id: c.helper_id, type: 'help_request',
        title: '🆘 附近有人需要帮助！', body: (hr.reason || '紧急求助') + ' (距离' + Math.round(dist) + '米)',
        data: JSON.stringify({ help_id: helpId, distance: dist }),
        status: 'pending', created_at: now()
      });
    }
  }
  saveDb('pushNotifications', notifications);
  const idx = requests.findIndex(r => r.id === helpId);
  if (idx >= 0) { requests[idx].stage = 'ready'; saveDb('helpRequests', requests); }
  sendJson(res, { success: true, help_id: helpId, filtered_count: filtered.length, filtered });
}

function getHelpRequest(req, res) {
  const requests = loadDb('helpRequests');
  const users = loadDb('users');
  const r = requests.find(x => x.id === req.params.id);
  if (!r) return sendJson(res, { success: false, error: '不存在' }, 404);
  const seeker = users.find(u => u.id === r.seeker_id);
  sendJson(res, { success: true, request: { ...r, seeker_nickname: seeker ? seeker.nickname : null } });
}

function cancelHelp(req, res) {
  const requests = loadDb('helpRequests');
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx >= 0) { requests[idx].status = 'cancelled'; requests[idx].resolved_at = now(); saveDb('helpRequests', requests); }
  sendJson(res, { success: true });
}

function acceptHelp(req, res, body) {
  const { helper_id, latitude, longitude } = body;
  const requests = loadDb('helpRequests');
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx < 0) return sendJson(res, { success: false, error: '不存在' }, 404);
  if (requests[idx].status !== 'pending') return sendJson(res, { success: false, error: '此求助已被响应' }, 400);
  if (latitude != null && longitude != null) {
    const dist = distance(requests[idx].latitude, requests[idx].longitude, latitude, longitude);
    if (dist > 10000) return sendJson(res, { success: false, error: '距离过远' }, 400);
  }
  requests[idx].status = 'accepted';
  requests[idx].accepted_by = helper_id;
  requests[idx].resolved_at = now();
  saveDb('helpRequests', requests);
  const notifications = loadDb('pushNotifications');
  notifications.push({
    id: uuid(), recipient_id: requests[idx].seeker_id, type: 'accepted',
    title: '有人来帮你了！', body: '帮助者已接单', data: JSON.stringify({ helper_id }),
    status: 'pending', created_at: now()
  });
  saveDb('pushNotifications', notifications);
  sendJson(res, { success: true });
}

function getNearbyHelp(req, res) {
  const query = url.parse(req.url, true).query;
  const lat = parseFloat(query.lat);
  const lon = parseFloat(query.lon);
  const requests = loadDb('helpRequests').filter(r => r.status === 'pending').sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
  const users = loadDb('users');
  const result = requests.map(r => {
    const seeker = users.find(u => u.id === r.seeker_id);
    const d = (lat && lon) ? distance(lat, lon, r.latitude, r.longitude) : null;
    return { ...r, seeker_nickname: seeker ? seeker.nickname : null, distance: d };
  });
  sendJson(res, { success: true, requests: result });
}

function requestTracking(req, res, body) {
  const seekerId = req.params.seekerId;
  const { guardian_id } = body;
  const users = loadDb('users');
  const seeker = users.find(u => u.id === seekerId);
  if (!seeker) return sendJson(res, { success: false, error: '患者不存在' }, 404);
  if (seeker.auto_consent) {
    const locs = loadDb('userLocations');
    const loc = locs.find(l => l.user_id === seekerId);
    const trackingId = uuid();
    const trackings = loadDb('locationTracking');
    trackings.push({
      id: trackingId, seeker_id: seekerId, guardian_id: guardian_id || null,
      latitude: loc ? loc.latitude : null, longitude: loc ? loc.longitude : null, address: loc ? loc.address : null,
      status: 'confirmed', requested_at: now(), responded_at: now(), completed_at: now()
    });
    saveDb('locationTracking', trackings);
    return sendJson(res, { success: true, tracking: { id: trackingId, status: 'confirmed', latitude: loc ? loc.latitude : null, longitude: loc ? loc.longitude : null }, auto: true });
  }
  const trackingId = uuid();
  const trackings = loadDb('locationTracking');
  trackings.push({ id: trackingId, seeker_id: seekerId, guardian_id: guardian_id || null, status: 'pending', requested_at: now() });
  saveDb('locationTracking', trackings);
  const notifications = loadDb('pushNotifications');
  notifications.push({
    id: uuid(), recipient_id: seekerId, type: 'track_request', title: '家属请求查看位置', body: '请确认',
    data: JSON.stringify({ tracking_id: trackingId }), status: 'pending', created_at: now()
  });
  saveDb('pushNotifications', notifications);
  sendJson(res, { success: true, tracking: { id: trackingId, status: 'pending' } });
}

function confirmTracking(req, res, body) {
  const { latitude, longitude, address } = body;
  const trackings = loadDb('locationTracking');
  const idx = trackings.findIndex(t => t.id === req.params.trackingId);
  if (idx >= 0) {
    trackings[idx].latitude = latitude; trackings[idx].longitude = longitude;
    trackings[idx].address = address || null; trackings[idx].status = 'confirmed';
    trackings[idx].responded_at = now(); trackings[idx].completed_at = now();
    saveDb('locationTracking', trackings);
  }
  sendJson(res, { success: true });
}

function denyTracking(req, res) {
  const trackings = loadDb('locationTracking');
  const idx = trackings.findIndex(t => t.id === req.params.trackingId);
  if (idx >= 0) { trackings[idx].status = 'denied'; trackings[idx].responded_at = now(); saveDb('locationTracking', trackings); }
  sendJson(res, { success: true });
}

function getRealtimeLocation(req, res) {
  const locs = loadDb('userLocations');
  const users = loadDb('users');
  const loc = locs.find(l => l.user_id === req.params.seekerId);
  const seeker = users.find(u => u.id === req.params.seekerId);
  if (!loc) return sendJson(res, { success: false, error: '无位置数据' }, 404);
  const sk = seeker ? { id: seeker.id, nickname: seeker.nickname, phone: seeker.phone, disability_type: seeker.disability_type } : null;
  sendJson(res, { success: true, location: loc, seeker: sk });
}

function updateTrackingConfig(req, res, body) {
  const { user_id, continuous_tracking, tracking_interval, geofence_radius, night_mode_enabled } = body;
  const users = loadDb('users');
  const idx = users.findIndex(u => u.id === user_id);
  if (idx >= 0) {
    if (continuous_tracking !== undefined) users[idx].continuous_tracking = continuous_tracking ? 1 : 0;
    if (tracking_interval) users[idx].tracking_interval = tracking_interval;
    if (geofence_radius) users[idx].geofence_radius = geofence_radius;
    if (night_mode_enabled !== undefined) users[idx].night_mode_enabled = night_mode_enabled ? 1 : 1;
    saveDb('users', users);
  }
  sendJson(res, { success: true });
}

function startTracking(req, res, body) {
  const users = loadDb('users');
  const idx = users.findIndex(u => u.id === body.user_id);
  if (idx >= 0) { users[idx].continuous_tracking = 1; users[idx].tracking_interval = body.tracking_interval || 600; saveDb('users', users); }
  sendJson(res, { success: true, message: '持续追踪已开启' });
}

function stopTracking(req, res, body) {
  const users = loadDb('users');
  const idx = users.findIndex(u => u.id === body.user_id);
  if (idx >= 0) { users[idx].continuous_tracking = 0; saveDb('users', users); }
  sendJson(res, { success: true });
}

function getPendingTracking(req, res) {
  const query = url.parse(req.url, true).query;
  const auth = parseAuth(req);
  const userId = query.userId || (auth && auth.id);
  const trackings = loadDb('locationTracking').filter(t => t.seeker_id === userId && t.status === 'pending').sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  const users = loadDb('users');
  const result = trackings.map(t => { const g = users.find(u => u.id === t.guardian_id); return { ...t, guardian_nickname: g ? g.nickname : null }; });
  sendJson(res, { success: true, pending: result });
}

function getGuardianTrackingHistory(req, res) {
  const auth = parseAuth(req);
  if (!auth) return sendJson(res, { success: false, error: '未登录' }, 401);
  const relations = loadDb('guardianRelations').filter(r => r.guardian_id === auth.id).map(r => r.seeker_id);
  const trackings = loadDb('locationTracking').filter(t => t.guardian_id === auth.id || relations.includes(t.seeker_id)).sort((a, b) => b.requested_at.localeCompare(a.requested_at)).slice(0, 50);
  sendJson(res, { success: true, history: trackings });
}

function getGeofence(req, res) {
  const fences = loadDb('geofence');
  const fence = fences.find(f => f.user_id === req.params.userId);
  sendJson(res, { success: true, geofence: fence || null });
}

function updateGeofence(req, res, body) {
  const { latitude, longitude, radius } = body;
  const fences = loadDb('geofence');
  const idx = fences.findIndex(f => f.user_id === req.params.userId);
  if (idx >= 0) { fences[idx].latitude = latitude; fences[idx].longitude = longitude; fences[idx].radius = radius || 500; fences[idx].updated_at = now(); }
  else { fences.push({ id: uuid(), user_id: req.params.userId, latitude, longitude, radius: radius || 500, enabled: 1, created_at: now(), updated_at: now() }); }
  saveDb('geofence', fences);
  const users = loadDb('users');
  const ui = users.findIndex(u => u.id === req.params.userId);
  if (ui >= 0) { users[ui].geofence_radius = radius || 500; saveDb('users', users); }
  sendJson(res, { success: true });
}

function enableGeofence(req, res) {
  const fences = loadDb('geofence');
  const idx = fences.findIndex(f => f.user_id === req.params.userId);
  if (idx >= 0) { fences[idx].enabled = 1; fences[idx].updated_at = now(); saveDb('geofence', fences); }
  sendJson(res, { success: true });
}

function disableGeofence(req, res) {
  const fences = loadDb('geofence');
  const idx = fences.findIndex(f => f.user_id === req.params.userId);
  if (idx >= 0) { fences[idx].enabled = 0; fences[idx].updated_at = now(); saveDb('geofence', fences); }
  sendJson(res, { success: true });
}

function getLocationHistory(req, res) {
  const history = loadDb('locationHistory').filter(h => h.user_id === req.params.userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
  sendJson(res, { success: true, history });
}

function getAlerts(req, res) {
  const alerts = loadDb('geofenceAlerts').filter(a => a.user_id === req.params.userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50);
  sendJson(res, { success: true, alerts });
}

function getStats(req, res) {
  sendJson(res, {
    success: true, stats: {
      total_users: loadDb('users').length,
      total_help_requests: loadDb('helpRequests').length,
      accepted_requests: loadDb('helpRequests').filter(r => r.status === 'accepted').length,
      total_push: loadDb('pushNotifications').length,
      total_location_reports: loadDb('locationHistory').length,
      total_geofence_alerts: loadDb('geofenceAlerts').length
    }
  });
}

function healthCheck(req, res) {
  sendJson(res, { status: 'ok', timestamp: now() });
}

// ---------- HTTP 服务器 ----------
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
    return res.end();
  }
  // 静态文件
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const file = path.join(__dirname, 'public', 'index.html');
    try {
      const content = fs.readFileSync(file, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(content);
    } catch (e) { return sendJson(res, { error: 'not found' }, 404); }
  }
  if (req.method === 'GET' && req.url.startsWith('/public/')) {
    const file = path.join(__dirname, req.url.replace(/^\/public\//, ''));
    try {
      const content = fs.readFileSync(file);
      const ext = path.extname(file);
      const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      return res.end(content);
    } catch (e) { return sendJson(res, { error: 'not found' }, 404); }
  }

  // 路由匹配
  const parsed = url.parse(req.url, true);
  const method = req.method;
  const pathname = parsed.pathname;
  req.params = {};

  let handler = null;
  for (const key of Object.keys(routes)) {
    const [m, route] = key.split(' ');
    if (m !== method) continue;
    const routeParts = route.split('/');
    const reqParts = pathname.split('/');
    if (routeParts.length !== reqParts.length) continue;
    let match = true;
    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) { params[routeParts[i].slice(1)] = decodeURIComponent(reqParts[i]); }
      else if (routeParts[i] !== reqParts[i]) { match = false; break; }
    }
    if (match) { handler = routes[key]; req.params = params; break; }
  }

  if (!handler) return sendJson(res, { success: false, error: 'Route not found: ' + method + ' ' + pathname }, 404);

  const body = (method === 'POST' || method === 'PUT' || method === 'PATCH') ? await readBody(req) : parsed.query;
  try { handler(req, res, body); }
  catch (e) { sendJson(res, { success: false, error: e.message }, 500); }
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🆘 互助SOS紧急求助平台 - 服务器');
  console.log('地址: http://localhost:' + PORT);
  console.log('测试页面: http://localhost:' + PORT + '/');
  console.log('健康检查: http://localhost:' + PORT + '/health');
  console.log('API统计: http://localhost:' + PORT + '/api/stats');
  console.log('启动时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(60));
});

module.exports = server;
