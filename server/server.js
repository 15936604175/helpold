const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { authMiddleware } = require('./utils');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(authMiddleware);

app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 路由挂载
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/location'));
app.use('/api', require('./routes/help'));
app.use('/api', require('./routes/tracking'));
app.use('/api', require('./routes/helperSchedule'));

// 统计接口
app.get('/api/stats', (req, res) => {
  try {
    const total_users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const total_help = db.prepare('SELECT COUNT(*) as c FROM help_requests').get().c;
    const accepted = db.prepare("SELECT COUNT(*) as c FROM help_requests WHERE status='accepted'").get().c;
    const total_push = db.prepare('SELECT COUNT(*) as c FROM push_notifications').get().c;
    const total_history = db.prepare('SELECT COUNT(*) as c FROM location_history').get().c;
    const total_alerts = db.prepare('SELECT COUNT(*) as c FROM geofence_alerts').get().c;
    res.json({
      success: true,
      stats: {
        total_users,
        total_help_requests: total_help,
        accepted_requests: accepted,
        total_push,
        total_location_reports: total_history,
        total_geofence_alerts: total_alerts
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('=' .repeat(60));
  console.log('🆘 互助SOS紧急求助平台');
  console.log('服务器运行于: http://localhost:' + PORT);
  console.log('测试页面: http://localhost:' + PORT + '/');
  console.log('启动时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('=' .repeat(60));
});

module.exports = app;
