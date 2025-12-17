import { StyleSheet } from 'react-native';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 20,
    width: '100%',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.ink,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  list: {
    marginTop: 10,
  },
  listItem: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
    marginBottom: 8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.md,
    marginTop: 20,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.danger,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.md,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.surface,
    fontSize: 16,
    fontFamily: fonts.semibold,
    marginLeft: 8,
  },
});
