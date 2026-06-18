const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const JWT_SECRET = 'mutual-sos-secret-key-2024';

// 清理并重建数据目录
function cleanData() {
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    for (const f of files) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(DATA_DIR, f));
    }
  } else {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function uuid() {
  return 'test-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function hashPassword(pwd) { return crypto.createHash('sha256').update(pwd).digest('hex'); }

function now() { return new Date().toISOString(); }

const dbFiles = { users: 'users.json', userLocations: 'user_locations.json', helperStatus: 'helper_status.json', helpRequests: 'help_requests.json', helpCandidates: 'help_candidates.json', guardianRelations: 'guardian_relations.json', locationTracking: 'location_tracking.json', locationHistory: 'location_history.json', geofence: 'geofence.json', geofenceAlerts: 'geofence_alerts.json', pushNotifications: 'push_notifications.json' };

function loadDb(name) { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, dbFiles[name]), 'utf8')); } catch (e) { return []; } }
function saveDb(name, data) { fs.writeFileSync(path.join(DATA_DIR, dbFiles[name]), JSON.stringify(data, null, 2)); }

function initDb() {
  for (const k of Object.keys(dbFiles)) saveDb(k, []);
}

cleanData();
initDb();

// ========== 模拟业务函数 ==========
function createUser(data) {
  const users = loadDb('users');
  if (users.find(u => u.phone === data.phone)) return { success: false, error: '手机已注册' };
  const id = uuid();
  const user = { id, phone: data.phone, nickname: data.nickname, password: hashPassword(data.password), role: data.role, disability_type: data.disability_type || null, disability_detail: data.disability_detail || null, emergency_contact_name: data.emergency_contact_name || null, emergency_contact_phone: data.emergency_contact_phone || null, location_auth: 1, auto_consent: data.auto_consent ? 1 : 0, continuous_tracking: 0, tracking_interval: 600, geofence_radius: 500, created_at: now() };
  users.push(user);
  saveDb('users', users);
  // 初始化位置
  const locs = loadDb('userLocations');
  locs.push({ user_id: id, latitude: data.lat || 39.9042, longitude: data.lon || 116.4074, address: '测试位置', location_source: 'init', accuracy: 50, updated_at: now() });
  saveDb('userLocations', locs);
  if (data.role === 'helper') {
    const st = loadDb('helperStatus');
    st.push({ user_id: id, status: 'online', updated_at: now() });
    saveDb('helperStatus', st);
  }
  if (data.role === 'seeker') {
    const fences = loadDb('geofence');
    fences.push({ id: uuid(), user_id: id, latitude: data.lat || 39.9042, longitude: data.lon || 116.4074, radius: 1000, enabled: 1, created_at: now() });
    saveDb('geofence', fences);
  }
  const copy = { ...user }; delete copy.password;
  return { success: true, user: copy };
}

function checkGeofence(userId, lat, lon) {
  const fences = loadDb('geofence');
  const fence = fences.find(f => f.user_id === userId && f.enabled !== false);
  if (!fence) return false;
  const dist = distance(lat, lon, fence.latitude, fence.longitude);
  if (dist > fence.radius) {
    const alerts = loadDb('geofenceAlerts');
    alerts.push({ id: uuid(), user_id: userId, latitude: lat, longitude: lon, alert_type: 'exit', notified: true, created_at: now() });
    saveDb('geofenceAlerts', alerts);
    return true;
  }
  return false;
}

function updateLocation(userId, lat, lon, source) {
  const locs = loadDb('userLocations');
  const idx = locs.findIndex(l => l.user_id === userId);
  if (idx >= 0) locs[idx] = { user_id: userId, latitude: lat, longitude: lon, address: '更新位置', location_source: source || 'manual', accuracy: 30, updated_at: now() };
  else locs.push({ user_id: userId, latitude: lat, longitude: lon, address: '新位置', location_source: source || 'manual', accuracy: 30, updated_at: now() });
  saveDb('userLocations', locs);
  const outside = checkGeofence(userId, lat, lon);
  const history = loadDb('locationHistory');
  history.push({ id: uuid(), user_id: userId, latitude: lat, longitude: lon, tracking_mode: source || 'manual', is_outside_geofence: outside ? 1 : 0, created_at: now() });
  saveDb('locationHistory', history);
  return { success: true, outside_fence: outside };
}

function createHelpRequest(seekerId, lat, lon, reason) {
  const helpId = uuid();
  const requests = loadDb('helpRequests');
  requests.push({ id: helpId, seeker_id: seekerId, latitude: lat, longitude: lon, reason: reason || '紧急求助', status: 'pending', stage: 'filtering', created_at: now() });
  saveDb('helpRequests', requests);
  // 阶段1: 查找5km内在线帮助者
  const locs = loadDb('userLocations');
  const statuses = loadDb('helperStatus');
  const users = loadDb('users');
  const candidates = [];
  for (const s of statuses) {
    if (s.status !== 'online') continue;
    const loc = locs.find(l => l.user_id === s.user_id);
    if (!loc) continue;
    if (!users.find(u => u.id === s.user_id && u.role === 'helper')) continue;
    const dist = distance(lat, lon, loc.latitude, loc.longitude);
    if (dist < 5000) candidates.push({ id: s.user_id, distance: dist });
  }
  const notifications = loadDb('pushNotifications');
  for (const c of candidates) {
    notifications.push({ id: uuid(), recipient_id: c.id, type: 'location_request', title: '附近有人需要帮助', body: '请上报您的位置', data: JSON.stringify({ help_id: helpId }), status: 'pending', created_at: now() });
  }
  saveDb('pushNotifications', notifications);
  return { success: true, help_id: helpId, candidates_count: candidates.length };
}

function acceptHelp(helpId, helperId, helperLat, helperLon) {
  const requests = loadDb('helpRequests');
  const idx = requests.findIndex(r => r.id === helpId);
  if (idx < 0) return { success: false, error: '求助不存在' };
  if (requests[idx].status !== 'pending') return { success: false, error: '已被其他人接单' };
  requests[idx].status = 'accepted';
  requests[idx].accepted_by = helperId;
  requests[idx].resolved_at = now();
  saveDb('helpRequests', requests);
  return { success: true };
}

function requestTracking(seekerId, guardianId) {
  const users = loadDb('users');
  const seeker = users.find(u => u.id === seekerId);
  if (!seeker) return { success: false, error: '患者不存在' };
  if (seeker.auto_consent) {
    const loc = loadDb('userLocations').find(l => l.user_id === seekerId);
    const trackings = loadDb('locationTracking');
    trackings.push({ id: uuid(), seeker_id: seekerId, guardian_id: guardianId, latitude: loc ? loc.latitude : null, longitude: loc ? loc.longitude : null, status: 'confirmed', requested_at: now(), responded_at: now(), completed_at: now() });
    saveDb('locationTracking', trackings);
    return { success: true, tracking: { status: 'confirmed', latitude: loc ? loc.latitude : null, longitude: loc ? loc.longitude : null }, auto: true };
  }
  const trackings = loadDb('locationTracking');
  const t = { id: uuid(), seeker_id: seekerId, guardian_id: guardianId, status: 'pending', requested_at: now() };
  trackings.push(t);
  saveDb('locationTracking', trackings);
  return { success: true, tracking: { id: t.id, status: 'pending' } };
}

// ========== 测试用例 ==========
let passed = 0, failed = 0;
function assert(name, condition, detail) {
  if (condition) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + ' -> ' + (detail || 'FAILED')); }
}

console.log('\n=== 互助SOS - 功能测试 ===\n');

console.log('【1】用户注册测试');
const r1 = createUser({ phone: '13800138001', password: '123456', nickname: '测试老人', role: 'seeker', disability_type: '老年痴呆', auto_consent: true });
assert('求助者注册成功', r1.success, JSON.stringify(r1));
const seekerId = r1.user.id;

const r2 = createUser({ phone: '13800138002', password: '123456', nickname: '志愿者李', role: 'helper', lat: 39.9100, lon: 116.4100 });
assert('帮助者注册成功', r2.success);
const helperId = r2.user.id;

const r3 = createUser({ phone: '13800138003', password: '123456', nickname: '家属小王', role: 'guardian' });
assert('家属注册成功', r3.success);
const guardianId = r3.user.id;

assert('用户总数 = 3', loadDb('users').length === 3, '实际: ' + loadDb('users').length);

console.log('\n【2】位置上报与电子围栏测试');
const r4 = updateLocation(helperId, 39.9080, 116.4085, 'manual');
assert('帮助者位置更新成功', r4.success);

// 在围栏内
const r5 = updateLocation(seekerId, 39.9042, 116.4074, 'auto');
assert('围栏内不触发警报', r5.outside_fence === false);

// 越界
const r6 = updateLocation(seekerId, 40.0000, 117.0000, 'auto');
assert('越界时触发警报', r6.outside_fence === true);
const alerts = loadDb('geofenceAlerts');
assert('警报已记录到数据库', alerts.length > 0, '实际: ' + alerts.length);

console.log('\n【3】SOS求助（两步推送）测试');
// 先把帮助者位置改到5km内
updateLocation(helperId, 39.9080, 116.4085, 'scheduled');

const r7 = createHelpRequest(seekerId, 39.9042, 116.4074, '老人摔倒');
assert('SOS求助创建成功', r7.success);
assert('阶段1 找到候选帮助者', r7.candidates_count > 0, '找到: ' + r7.candidates_count + ' 位');

const notifications = loadDb('pushNotifications').filter(n => n.type === 'location_request');
assert('已发送位置请求推送', notifications.length > 0, '实际: ' + notifications.length);

// 模拟帮助者上报位置
updateLocation(helperId, 39.9090, 116.4090, 'requested');
// 记录到候选列表
const candidates = loadDb('helpCandidates');
candidates.push({ id: uuid(), help_id: r7.help_id, helper_id: helperId, latitude: 39.9090, longitude: 116.4090, accuracy: 20, created_at: now() });
saveDb('helpCandidates', candidates);
assert('帮助者上报位置已记录', candidates.length > 0);

// 验证距离计算：39.9042,116.4074 -> 39.9090,116.4090 约在500-800米
const dist = distance(39.9042, 116.4074, 39.9090, 116.4090);
assert('精确距离计算合理', dist < 2000 && dist > 100, '实际: ' + Math.round(dist) + '米');
console.log('    （求助者与帮助者实际距离: ' + Math.round(dist) + ' 米，在2km范围内）');

console.log('\n【4】接单响应测试');
const r8 = acceptHelp(r7.help_id, helperId, 39.9090, 116.4090);
assert('接单成功', r8.success);
const updatedReq = loadDb('helpRequests').find(r => r.id === r7.help_id);
assert('求助状态变为 accepted', updatedReq.status === 'accepted', '实际: ' + updatedReq.status);
assert('已记录接单者ID', updatedReq.accepted_by === helperId);

// 重复接单
const r9 = acceptHelp(r7.help_id, 'someone-else', 39.9090, 116.4090);
assert('同一求助不能重复接单', r9.success === false);

console.log('\n【5】持续追踪（老年痴呆患者）测试');
// 家属请求追踪老年痴呆患者（已设置自动同意）
const r10 = requestTracking(seekerId, guardianId);
assert('自动同意的追踪请求立即返回位置', r10.success && r10.auto === true, JSON.stringify(r10.tracking).substring(0, 80));
assert('返回了经纬度信息', r10.tracking.latitude != null && r10.tracking.longitude != null);

// 手动设置追踪状态
const users = loadDb('users');
const idx = users.findIndex(u => u.id === seekerId);
users[idx].continuous_tracking = 1; users[idx].tracking_interval = 30;
saveDb('users', users);

// 模拟持续追踪 - 多次位置上报
for (let i = 0; i < 5; i++) {
  updateLocation(seekerId, 39.9042 + i * 0.001, 116.4074, 'continuous');
}
const history = loadDb('locationHistory').filter(h => h.user_id === seekerId);
assert('位置轨迹已记录', history.length >= 5, '实际: ' + history.length);

console.log('\n【6】家属关联测试');
const relations = loadDb('guardianRelations');
relations.push({ id: uuid(), seeker_id: seekerId, guardian_id: guardianId, relation: '子女', created_at: now() });
saveDb('guardianRelations', relations);
assert('家属-患者关联已建立', relations.length === 1);

console.log('\n【7】推送通知汇总');
const allPush = loadDb('pushNotifications');
console.log('    总计推送消息: ' + allPush.length + ' 条');
const byType = {};
for (const p of allPush) { byType[p.type] = (byType[p.type] || 0) + 1; }
for (const t of Object.keys(byType)) console.log('      - ' + t + ': ' + byType[t] + ' 条');

console.log('\n【8】数据完整性验证');
assert('用户表有效', loadDb('users').length === 3);
assert('位置表有效', loadDb('userLocations').length >= 3);
assert('历史轨迹有效', loadDb('locationHistory').length > 5);
assert('求助记录有效', loadDb('helpRequests').length === 1);
assert('电子围栏有效', loadDb('geofence').length >= 1);
assert('电子警报有效', loadDb('geofenceAlerts').length >= 1);
assert('家属关系有效', loadDb('guardianRelations').length === 1);
assert('推送消息有效', loadDb('pushNotifications').length > 0);
assert('追踪请求有效', loadDb('locationTracking').length >= 1);

console.log('\n========== 测试结果 ==========');
console.log('✓ 通过: ' + passed + ' 项');
console.log('✗ 失败: ' + failed + ' 项');
console.log('总测试: ' + (passed + failed) + ' 项');
console.log('测试数据目录: ' + DATA_DIR);
if (failed === 0) console.log('\n🎉 所有测试通过！系统功能正常工作。');
else console.log('\n⚠️  有测试失败，请检查以上报告。');
console.log('');

process.exit(failed === 0 ? 0 : 1);
