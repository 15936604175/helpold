// 帮助者固定位置计划管理路由
const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, authMiddleware } = require('../utils');

// ============ 位置计划 CRUD ============

// 获取我的所有位置计划
router.get('/helper/location-schedules', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  try {
    const schedules = db.prepare(
      'SELECT * FROM helper_location_schedules WHERE user_id = ? ORDER BY day_of_week ASC, start_time ASC'
    ).all(req.user.id);
    res.json({ success: true, schedules });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 新增位置计划条目
router.post('/helper/location-schedules', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const {
    name, days_of_week, start_time, end_time,
    latitude, longitude, address, address_detail
  } = req.body;

  if (!name || !days_of_week || !start_time || !end_time || latitude == null || longitude == null || !address) {
    return res.status(400).json({
      success: false,
      error: '缺少必填字段: name, days_of_week, start_time, end_time, latitude, longitude, address'
    });
  }

  if (!Array.isArray(days_of_week) || days_of_week.length === 0) {
    return res.status(400).json({ success: false, error: 'days_of_week 必须为非空数组' });
  }

  // 校验星期值
  for (const d of days_of_week) {
    if (d < 0 || d > 6 || !Number.isInteger(d)) {
      return res.status(400).json({ success: false, error: 'days_of_week 取值必须为 0-6 的整数' });
    }
  }

  // 校验时间格式 HH:MM
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return res.status(400).json({ success: false, error: '时间格式必须为 HH:MM' });
  }

  try {
    const now = new Date().toISOString();
    const created = [];

    // 为每个星期几插入一条记录
    for (const dow of days_of_week) {
      // 校验时间重叠
      const overlap = db.prepare(
        `SELECT id FROM helper_location_schedules
         WHERE user_id = ? AND day_of_week = ? AND enabled = 1
         AND NOT (end_time <= ? OR start_time >= ?)`
      ).get(req.user.id, dow, start_time, end_time);

      if (overlap) {
        return res.status(400).json({
          success: false,
          error: `星期${dow} 在 ${start_time}-${end_time} 已有重叠的启用计划`
        });
      }

      const id = generateUUID();
      db.prepare(
        `INSERT INTO helper_location_schedules
         (id, user_id, name, day_of_week, start_time, end_time, latitude, longitude, address, address_detail, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, req.user.id, name, dow, start_time, end_time,
        latitude, longitude, address, address_detail || null, 1, now, now);

      const row = db.prepare('SELECT * FROM helper_location_schedules WHERE id = ?').get(id);
      if (row) created.push(row);
    }

    // 新增完成后自动重新计算当前位置
    const currentLocation = recomputeHelperLocation(req.user.id);

    res.json({
      success: true,
      schedules: created,
      current_location: currentLocation
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 更新位置计划条目
router.put('/helper/location-schedules/:id', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM helper_location_schedules WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, error: '计划不存在' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: '无权修改他人计划' });
  }

  const {
    name, day_of_week, start_time, end_time,
    latitude, longitude, address, address_detail, enabled
  } = req.body;

  // 校验时间格式（如果提供）
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (start_time && !timeRegex.test(start_time)) {
    return res.status(400).json({ success: false, error: 'start_time 格式必须为 HH:MM' });
  }
  if (end_time && !timeRegex.test(end_time)) {
    return res.status(400).json({ success: false, error: 'end_time 格式必须为 HH:MM' });
  }
  if (day_of_week != null && (day_of_week < 0 || day_of_week > 6 || !Number.isInteger(day_of_week))) {
    return res.status(400).json({ success: false, error: 'day_of_week 取值必须为 0-6 的整数' });
  }

  // 校验时间重叠（如果修改了时间或星期）
  const newStart = start_time || existing.start_time;
  const newEnd = end_time || existing.end_time;
  const newDow = day_of_week != null ? day_of_week : existing.day_of_week;
  const newEnabled = enabled != null ? (enabled ? 1 : 0) : existing.enabled;

  if (newEnabled === 1) {
    const overlap = db.prepare(
      `SELECT id FROM helper_location_schedules
       WHERE user_id = ? AND day_of_week = ? AND enabled = 1 AND id != ?
       AND NOT (end_time <= ? OR start_time >= ?)`
    ).get(req.user.id, newDow, id, newStart, newEnd);

    if (overlap) {
      return res.status(400).json({
        success: false,
        error: `星期${newDow} 在 ${newStart}-${newEnd} 已有重叠的启用计划`
      });
    }
  }

  try {
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE helper_location_schedules
       SET name = ?, day_of_week = ?, start_time = ?, end_time = ?,
           latitude = ?, longitude = ?, address = ?, address_detail = ?,
           enabled = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      name || existing.name,
      newDow,
      newStart,
      newEnd,
      latitude != null ? latitude : existing.latitude,
      longitude != null ? longitude : existing.longitude,
      address || existing.address,
      address_detail !== undefined ? (address_detail || null) : existing.address_detail,
      newEnabled,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM helper_location_schedules WHERE id = ?').get(id);

    // 重新计算当前位置
    const currentLocation = recomputeHelperLocation(req.user.id);

    res.json({
      success: true,
      schedule: updated,
      current_location: currentLocation
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 删除位置计划条目
router.delete('/helper/location-schedules/:id', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM helper_location_schedules WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, error: '计划不存在' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: '无权删除他人计划' });
  }

  try {
    db.prepare('DELETE FROM helper_location_schedules WHERE id = ?').run(id);
    const currentLocation = recomputeHelperLocation(req.user.id);
    res.json({ success: true, current_location: currentLocation });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 手动触发重新计算当前位置
router.post('/helper/location-schedules/recompute', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  try {
    const currentLocation = recomputeHelperLocation(req.user.id);
    res.json({ success: true, current_location: currentLocation });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============ 位置计划匹配核心逻辑 ============

/**
 * 根据当前时间匹配帮助者的位置计划，计算当前位置
 * @param {string} helperUserId - 帮助者用户ID
 * @returns {Object|null} - { plan_id, latitude, longitude, address } 或 null（无匹配）
 */
function recomputeHelperLocation(helperUserId) {
  const now = new Date();
  // JavaScript: 0=周日, 1-6=周一至周六（与文档定义一致）
  const dayOfWeek = now.getDay();
  // 当前时间 HH:MM
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  // 查询当前时间匹配的启用计划
  const matched = db.prepare(
    `SELECT * FROM helper_location_schedules
     WHERE user_id = ? AND enabled = 1 AND day_of_week = ?
     AND start_time <= ? AND end_time > ?
     ORDER BY start_time DESC
     LIMIT 1`
  ).get(helperUserId, dayOfWeek, currentTime, currentTime);

  if (!matched) {
    // 无匹配：清除缓存位置
    db.prepare(
      `UPDATE helper_status
       SET current_plan_id = NULL, current_latitude = NULL,
           current_longitude = NULL, current_address = NULL, updated_at = ?
       WHERE user_id = ?`
    ).run(now.toISOString(), helperUserId);
    return null;
  }

  // 更新缓存位置
  db.prepare(
    `UPDATE helper_status
     SET current_plan_id = ?, current_latitude = ?, current_longitude = ?,
         current_address = ?, updated_at = ?
     WHERE user_id = ?`
  ).run(
    matched.id, matched.latitude, matched.longitude,
    matched.address, now.toISOString(), helperUserId
  );

  // 同步更新 user_locations 表（保持位置查询一致性）
  const existingLoc = db.prepare('SELECT user_id FROM user_locations WHERE user_id = ?').get(helperUserId);
  if (existingLoc) {
    db.prepare(
      `UPDATE user_locations
       SET latitude = ?, longitude = ?, address = ?, location_source = ?, updated_at = ?
       WHERE user_id = ?`
    ).run(matched.latitude, matched.longitude, matched.address, 'schedule', now.toISOString(), helperUserId);
  } else {
    db.prepare(
      `INSERT INTO user_locations (user_id, latitude, longitude, address, location_source, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(helperUserId, matched.latitude, matched.longitude, matched.address, 'schedule', now.toISOString());
  }

  return {
    plan_id: matched.id,
    plan_name: matched.name,
    latitude: matched.latitude,
    longitude: matched.longitude,
    address: matched.address,
    day_of_week: matched.day_of_week,
    start_time: matched.start_time,
    end_time: matched.end_time
  };
}

// 导出 recompute 函数供其他路由使用
router.recomputeHelperLocation = recomputeHelperLocation;

module.exports = router;
