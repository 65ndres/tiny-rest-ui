import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { getAppWindow } from '@/constants/appViewport';

const { width: appWidth, height: appHeight } = getAppWindow();

export const onboardingHeight = appHeight;
export const onboardingWidth = appWidth;

/** Design values are authored against a 812pt baseline; height is capped at Pro Max. */
export const vh = (value: number) => (onboardingHeight / 812) * value;

export const slideStyles = StyleSheet.create({
  title: {
    fontSize: vh(28),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vh(16),
    paddingHorizontal: vh(8),
  } as TextStyle,
  body: {
    fontSize: vh(17),
    lineHeight: vh(26),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 1,
    textAlign: 'center',
    paddingHorizontal: vh(8),
  } as TextStyle,
  titleCenter: {
    fontSize: vh(28),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vh(16),
    paddingHorizontal: vh(8),
  } as TextStyle,
  bodyLeft: {
    fontSize: vh(17),
    lineHeight: vh(26),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 1,
    textAlign: 'left',
    paddingHorizontal: vh(8),
  } as TextStyle,
});

export const onboardingSlideLayoutStyles = StyleSheet.create({
  root: {
    flex: 1,
  } as ViewStyle,
  main: {
    flex: 1,
    justifyContent: 'flex-start',
  } as ViewStyle,
  bodySpacing: {},
});

export const onboardingSampleStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  } as ViewStyle,
  text: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: vh(17),
    textAlign: 'center',
    marginBottom: vh(12),
  } as TextStyle,
});

export const onboardingBenefitListStyles = StyleSheet.create({
  benefits: {
    marginTop: vh(6),
  } as ViewStyle,
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  } as ViewStyle,
  bulletIcon: {
    width: vh(22),
    marginTop: vh(2),
    marginRight: vh(8),
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: vh(16),
    textAlign: 'center',
  } as TextStyle,
  benefitText: {
    flex: 1,
  } as ViewStyle,
  boldLabel: {
    fontWeight: '800',
  } as TextStyle,
});

/** Matches subscription primary CTA; used for in-slide NEXT on onboarding. */
export const slideNextButtonStyles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: vh(2),
    borderColor: '#FFFFFF',
    borderRadius: vh(30),
    paddingVertical: onboardingHeight * 0.014,
  } as ViewStyle,
  container: {
    marginHorizontal: vh(8),
    marginTop: vh(16),
    alignSelf: 'stretch',
  } as ViewStyle,
  title: {
    fontWeight: 'bold',
    color: '#ac8861ff',
    fontSize: vh(16),
  } as TextStyle,
});
