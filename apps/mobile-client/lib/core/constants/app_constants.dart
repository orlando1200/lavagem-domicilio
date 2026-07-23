class AppConstants {
  static const baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000/api/v1');
}
