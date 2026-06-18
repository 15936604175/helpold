import 'package:flutter/material.dart';

/// 应用主题配置
///
/// 遵循用户偏好：
/// - 仅使用 Light 主题
/// - 悬停状态使用琥珀色（amber）而非默认蓝色
/// - 选中状态使用统一颜色
class AppTheme {
  /// 主色：琥珀色（用于悬停、选中、强调）
  static const Color primaryColor = Color(0xFFFFA000); // Amber 700
  static const Color primaryLightColor = Color(0xFFFFD54F); // Amber 300
  static const Color primaryDarkColor = Color(0xFFFF6F00); // Amber 900

  /// 辅助色
  static const Color accentColor = Color(0xFFFFC107); // Amber 500

  /// 状态色
  static const Color successColor = Color(0xFF4CAF50);
  static const Color warningColor = Color(0xFFFF9800);
  static const Color errorColor = Color(0xFFE53935);
  static const Color infoColor = Color(0xFF29B6F6);

  /// SOS 专用红色
  static const Color sosRed = Color(0xFFD32F2F);

  /// 背景色
  static const Color scaffoldBgColor = Color(0xFFFAFAFA);
  static const Color cardColor = Colors.white;

  /// 文本色
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);

  static ThemeData get lightTheme {
    final base = ThemeData.light(useMaterial3: true);

    return base.copyWith(
      colorScheme: base.colorScheme.copyWith(
        primary: primaryColor,
        secondary: accentColor,
        surface: cardColor,
      ),
      primaryColor: primaryColor,
      scaffoldBackgroundColor: scaffoldBgColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: textHint),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        labelStyle: const TextStyle(color: textSecondary),
      ),
      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        selectedColor: primaryColor,
        selectedTileColor: Color(0xFFFFF8E1), // Amber 50
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: primaryColor,
        unselectedItemColor: textSecondary,
        selectedIconTheme: IconThemeData(color: primaryColor),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryColor;
          }
          return textHint;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryLightColor;
          }
          return textHint.withOpacity(0.3);
        }),
      ),
    );
  }
}
