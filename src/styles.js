import { StyleSheet, Platform } from 'react-native';

// Цветовая система
export const colors = {
  primary: '#4361EE',
  primaryDark: '#3A0CA3',
  primaryLight: '#4895EF',
  secondary: '#7209B7',
  accent: '#F72585',
  success: '#4CC9F0',
  warning: '#F8961E',
  danger: '#EF233C',
  light: '#F8F9FA',
  medium: '#E9ECEF',
  dark: '#212529',
  white: '#FFFFFF',
  gray: '#ADB5BD',
  black: '#000000',
};

// Типография
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
};

// Базовые стили
export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.light,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});

// Стили для форм
export const formStyles = StyleSheet.create({
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    ...typography.body,
    color: colors.dark,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.medium,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    ...typography.body,
    color: colors.dark,
  },
  error: {
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
  },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
});

// Стили для навигации
export const navStyles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  tabBar: {
    height: 64,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

// Стили для статусов задач
export const taskStyles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: (status) => ({
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: statusBackgrounds[status],
  }),
  statusText: (status) => ({
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: statusColors[status],
  }),
});

const statusBackgrounds = {
  open: '#E3F2FD',
  in_progress: '#FFF8E1',
  blocked: '#FFEBEE',
  completed: '#E8F5E9',
};

const statusColors = {
  open: '#1976D2',
  in_progress: '#FF8F00',
  blocked: '#D32F2F',
  completed: '#388E3C',
};