import 'package:flutter/material.dart';
import 'config/routes.dart';
import 'config/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HelpoldSosApp());
}

class HelpoldSosApp extends StatelessWidget {
  const HelpoldSosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '互助SOS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: Routes.splash,
      onGenerateRoute: onGenerateRoute,
    );
  }
}
