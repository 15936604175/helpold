import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 帮助者固定位置计划设置页
///
/// 类比打车软件选上车点：帮助者可随意填写某时间段所在的位置，
/// 不需要暴露真实住址。系统根据当前时间自动匹配位置参与求助筛选。
class LocationSchedulePage extends StatefulWidget {
  const LocationSchedulePage({super.key});

  @override
  State<LocationSchedulePage> createState() => _LocationSchedulePageState();
}

class _LocationSchedulePageState extends State<LocationSchedulePage> {
  final ScheduleService _service = ScheduleService();
  List<LocationSchedule> _schedules = [];
  CurrentLocation? _currentLocation;
  bool _loading = true;
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final res = await _service.getSchedules();
    if (res.success && res.data['schedules'] != null) {
      _schedules = (res.data['schedules'] as List)
          .map((e) => LocationSchedule.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    await _recomputeLocation();
    setState(() => _loading = false);
  }

  Future<void> _recomputeLocation() async {
    final res = await _service.recomputeLocation();
    if (res.success && res.data['current_location'] != null) {
      _currentLocation = CurrentLocation.fromJson(
          res.data['current_location'] as Map<String, dynamic>);
    } else {
      _currentLocation = null;
    }
  }

  Future<void> _refresh() async {
    setState(() => _refreshing = true);
    await _loadData();
    setState(() => _refreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('位置计划'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshing ? null : _refresh,
            tooltip: '刷新',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInfoCard(),
                  const SizedBox(height: 16),
                  _buildCurrentLocationCard(),
                  const SizedBox(height: 16),
                  _buildScheduleList(),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _addSchedule,
                    icon: const Icon(Icons.add),
                    label: const Text('添加位置计划'),
                  ),
                ],
              ),
            ),
    );
  }

  /// 说明卡片
  Widget _buildInfoCard() {
    return Card(
      color: AppTheme.primaryColor.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info_outline, color: AppTheme.primaryColor, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '类比打车软件选上车点：位置可随意填写，不必是真实住址。'
                '系统根据当前时间自动匹配位置，用于求助距离筛选。',
                style: TextStyle(fontSize: 13, color: AppTheme.textPrimary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 当前匹配到的位置卡片
  Widget _buildCurrentLocationCard() {
    final loc = _currentLocation;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.my_location,
                    color: loc != null
                        ? AppTheme.successColor
                        : AppTheme.textSecondary,
                    size: 20),
                const SizedBox(width: 8),
                Text(
                  loc != null ? '当前位置（已匹配）' : '当前位置（无匹配）',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            if (loc != null) ...[
              _infoRow('计划名称', loc.planName ?? '-'),
              _infoRow('地址', loc.address ?? '-'),
              _infoRow(
                '时间段',
                loc.startTime != null && loc.endTime != null
                    ? '${loc.startTime} - ${loc.endTime}'
                    : '-',
              ),
              _infoRow(
                '坐标',
                loc.latitude != null && loc.longitude != null
                    ? '${loc.latitude!.toStringAsFixed(4)}, ${loc.longitude!.toStringAsFixed(4)}'
                    : '-',
              ),
            ] else
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  '当前时间没有匹配到任何启用的位置计划，'
                  '您将不会出现在求助筛选列表中。',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                ),
              ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () async {
                await _recomputeLocation();
                setState(() {});
                if (mounted) {
                  CommonWidgets.showSnackBar(
                    context,
                    _currentLocation != null ? '已重新计算位置' : '当前无匹配位置',
                    isSuccess: _currentLocation != null,
                  );
                }
              },
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('重新计算'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: const TextStyle(color: AppTheme.textSecondary)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  /// 位置计划列表
  Widget _buildScheduleList() {
    if (_schedules.isEmpty) {
      return CommonWidgets.emptyState(
        icon: Icons.schedule,
        message: '还没有位置计划\n点击下方按钮添加第一条',
      );
    }

    // 按星期分组
    final grouped = <int, List<LocationSchedule>>{};
    for (final s in _schedules) {
      grouped.putIfAbsent(s.dayOfWeek, () => []).add(s);
    }
    final sortedDays = grouped.keys.toList()..sort();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('我的位置计划',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        ...sortedDays.map((day) => _buildDayGroup(day, grouped[day]!)),
      ],
    );
  }

  Widget _buildDayGroup(int day, List<LocationSchedule> schedules) {
    schedules.sort((a, b) => a.startTime.compareTo(b.startTime));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            _dayLabel(day),
            style: TextStyle(
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        ...schedules.map((s) => _buildScheduleCard(s)),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildScheduleCard(LocationSchedule s) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Row(
          children: [
            Icon(
              s.enabled ? Icons.location_on : Icons.location_off,
              color: s.enabled
                  ? AppTheme.primaryColor
                  : AppTheme.textSecondary,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                s.name,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: s.enabled
                      ? AppTheme.textPrimary
                      : AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              '${s.timeRangeLabel}  ${s.address}',
              style: const TextStyle(fontSize: 13),
            ),
          ],
        ),
        trailing: Switch(
          value: s.enabled,
          onChanged: (val) => _toggleSchedule(s, val),
        ),
        onTap: () => _editSchedule(s),
        onLongPress: () => _deleteSchedule(s),
      ),
    );
  }

  String _dayLabel(int day) {
    const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return labels[day.clamp(0, 6)];
  }

  // ============ 操作 ============

  Future<void> _toggleSchedule(LocationSchedule s, bool enabled) async {
    final res = await _service.updateSchedule(
      id: s.id!,
      enabled: enabled,
    );
    if (res.success) {
      CommonWidgets.showSnackBar(
        context,
        enabled ? '已启用' : '已关闭',
        isSuccess: true,
      );
      await _loadData();
    } else {
      CommonWidgets.showSnackBar(
        context,
        res.error ?? '操作失败',
        isError: true,
      );
    }
  }

  Future<void> _addSchedule() async {
    final result = await showDialog<LocationSchedule>(
      context: context,
      builder: (_) => const _ScheduleEditDialog(),
    );
    if (result == null) return;

    final res = await _service.addSchedule(
      name: result.name,
      daysOfWeek: [result.dayOfWeek],
      startTime: result.startTime,
      endTime: result.endTime,
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      addressDetail: result.addressDetail,
    );

    if (res.success) {
      CommonWidgets.showSnackBar(context, '添加成功', isSuccess: true);
      await _loadData();
    } else {
      CommonWidgets.showSnackBar(
        context,
        res.error ?? '添加失败',
        isError: true,
      );
    }
  }

  Future<void> _editSchedule(LocationSchedule s) async {
    final result = await showDialog<LocationSchedule>(
      context: context,
      builder: (_) => _ScheduleEditDialog(schedule: s),
    );
    if (result == null) return;

    final res = await _service.updateSchedule(
      id: s.id!,
      name: result.name,
      dayOfWeek: result.dayOfWeek,
      startTime: result.startTime,
      endTime: result.endTime,
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      addressDetail: result.addressDetail,
    );

    if (res.success) {
      CommonWidgets.showSnackBar(context, '更新成功', isSuccess: true);
      await _loadData();
    } else {
      CommonWidgets.showSnackBar(
        context,
        res.error ?? '更新失败',
        isError: true,
      );
    }
  }

  Future<void> _deleteSchedule(LocationSchedule s) async {
    final confirmed = await CommonWidgets.showConfirmDialog(
      context,
      title: '删除位置计划',
      content: '确定删除「${s.name}（${_dayLabel(s.dayOfWeek)} ${s.timeRangeLabel}）」吗？',
      danger: true,
    );
    if (!confirmed) return;

    final res = await _service.deleteSchedule(s.id!);
    if (res.success) {
      CommonWidgets.showSnackBar(context, '已删除', isSuccess: true);
      await _loadData();
    } else {
      CommonWidgets.showSnackBar(
        context,
        res.error ?? '删除失败',
        isError: true,
      );
    }
  }
}

/// 位置计划编辑对话框
class _ScheduleEditDialog extends StatefulWidget {
  final LocationSchedule? schedule; // null=新增，非null=编辑

  const _ScheduleEditDialog({this.schedule});

  @override
  State<_ScheduleEditDialog> createState() => _ScheduleEditDialogState();
}

class _ScheduleEditDialogState extends State<_ScheduleEditDialog> {
  late TextEditingController _nameCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _addressDetailCtrl;
  late TextEditingController _latCtrl;
  late TextEditingController _lonCtrl;

  int _dayOfWeek = 1;
  TimeOfDay _startTime = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 17, minute: 0);

  @override
  void initState() {
    super.initState();
    final s = widget.schedule;
    _nameCtrl = TextEditingController(text: s?.name ?? '');
    _addressCtrl = TextEditingController(text: s?.address ?? '');
    _addressDetailCtrl = TextEditingController(text: s?.addressDetail ?? '');
    _latCtrl = TextEditingController(
      text: s != null ? s.latitude.toString() : '39.9042',
    );
    _lonCtrl = TextEditingController(
      text: s != null ? s.longitude.toString() : '116.4074',
    );
    if (s != null) {
      _dayOfWeek = s.dayOfWeek;
      _startTime = _parseTime(s.startTime);
      _endTime = _parseTime(s.endTime);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _addressDetailCtrl.dispose();
    _latCtrl.dispose();
    _lonCtrl.dispose();
    super.dispose();
  }

  TimeOfDay _parseTime(String t) {
    final parts = t.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.schedule != null;
    return AlertDialog(
      title: Text(isEdit ? '编辑位置计划' : '添加位置计划'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: '计划名称 *',
                hintText: '如：工作时间、在家、外出',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: _dayOfWeek,
              decoration: const InputDecoration(
                labelText: '适用星期 *',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 0, child: Text('周日')),
                DropdownMenuItem(value: 1, child: Text('周一')),
                DropdownMenuItem(value: 2, child: Text('周二')),
                DropdownMenuItem(value: 3, child: Text('周三')),
                DropdownMenuItem(value: 4, child: Text('周四')),
                DropdownMenuItem(value: 5, child: Text('周五')),
                DropdownMenuItem(value: 6, child: Text('周六')),
              ],
              onChanged: (v) => setState(() => _dayOfWeek = v ?? 1),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final t = await showTimePicker(
                        context: context,
                        initialTime: _startTime,
                      );
                      if (t != null) setState(() => _startTime = t);
                    },
                    icon: const Icon(Icons.access_time, size: 18),
                    label: Text('开始 ${_formatTime(_startTime)}'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final t = await showTimePicker(
                        context: context,
                        initialTime: _endTime,
                      );
                      if (t != null) setState(() => _endTime = t);
                    },
                    icon: const Icon(Icons.access_time, size: 18),
                    label: Text('结束 ${_formatTime(_endTime)}'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _addressCtrl,
              decoration: const InputDecoration(
                labelText: '位置地址 *',
                hintText: '可随意填写，如"望京"、"国贸商圈"',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_on),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _addressDetailCtrl,
              decoration: const InputDecoration(
                labelText: '详细地址（可选）',
                hintText: '楼号、门牌等',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _latCtrl,
                    decoration: const InputDecoration(
                      labelText: '纬度 *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                        signed: true, decimal: true),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _lonCtrl,
                    decoration: const InputDecoration(
                      labelText: '经度 *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                        signed: true, decimal: true),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '提示：可使用默认坐标或自行填写。地址用于显示，坐标用于距离计算。',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _submit,
          child: Text(isEdit ? '保存' : '添加'),
        ),
      ],
    );
  }

  void _submit() {
    final name = _nameCtrl.text.trim();
    final address = _addressCtrl.text.trim();
    final lat = double.tryParse(_latCtrl.text.trim());
    final lon = double.tryParse(_lonCtrl.text.trim());

    if (name.isEmpty) {
      CommonWidgets.showSnackBar(context, '请填写计划名称', isError: true);
      return;
    }
    if (address.isEmpty) {
      CommonWidgets.showSnackBar(context, '请填写位置地址', isError: true);
      return;
    }
    if (lat == null || lon == null) {
      CommonWidgets.showSnackBar(context, '坐标格式错误', isError: true);
      return;
    }

    Navigator.pop(context, LocationSchedule(
      id: widget.schedule?.id,
      userId: widget.schedule?.userId ?? '',
      name: name,
      dayOfWeek: _dayOfWeek,
      startTime: _formatTime(_startTime),
      endTime: _formatTime(_endTime),
      latitude: lat,
      longitude: lon,
      address: address,
      addressDetail: _addressDetailCtrl.text.trim().isEmpty
          ? null
          : _addressDetailCtrl.text.trim(),
      enabled: true,
    ));
  }
}
