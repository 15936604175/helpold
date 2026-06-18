import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 求助列表页 - 显示附近求助
class HelpListPage extends StatefulWidget {
  const HelpListPage({super.key});

  @override
  State<HelpListPage> createState() => _HelpListPageState();
}

class _HelpListPageState extends State<HelpListPage> {
  List<HelpRequest> _requests = [];
  bool _loading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetch();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _fetch());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetch() async {
    final res = await HelpService().getNearbyHelp(
      lat: AppConfig.defaultLatitude,
      lon: AppConfig.defaultLongitude,
    );
    if (res.success && mounted) {
      setState(() {
        _requests = (res.data['requests'] as List)
            .map((r) => HelpRequest.fromJson(r as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } else if (mounted) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('附近求助'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _loading = true);
              _fetch();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _requests.isEmpty
              ? CommonWidgets.emptyState(
                  icon: Icons.check_circle,
                  message: '附近暂无求助',
                )
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _requests.length,
                    itemBuilder: (ctx, index) {
                      final r = _requests[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => Navigator.pushNamed(
                            context,
                            Routes.helpAccept,
                            arguments: r.id,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: AppTheme.sosRed,
                                      child: const Icon(Icons.sos,
                                          color: Colors.white),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            r.seekerNickname ?? '求助者',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16),
                                          ),
                                          Text(
                                            formatTime(r.createdAt),
                                            style: const TextStyle(
                                                fontSize: 12,
                                                color: AppTheme.textSecondary),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (r.distance != null)
                                      Chip(
                                        label: Text(formatDistance(r.distance)),
                                        backgroundColor: AppTheme
                                            .primaryLightColor
                                            .withOpacity(0.3),
                                      ),
                                  ],
                                ),
                                const Divider(height: 16),
                                Row(
                                  children: [
                                    if (r.disabilityType != null)
                                      Chip(
                                        label: Text(r.disabilityType!),
                                        backgroundColor: AppTheme
                                            .primaryColor
                                            .withOpacity(0.2),
                                      ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        r.reason ?? '紧急求助',
                                        style: const TextStyle(
                                            color: AppTheme.textSecondary),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
