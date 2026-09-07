import type { TextStyle, ViewStyle } from 'react-native';
import { padX, vh } from '@/constants/appViewport';

export const SCREEN_TOP_HEIGHT = '10%';
export const SCREEN_CONTENT_HEIGHT = '80%';
export const SCREEN_FOOTER_HEIGHT = '10%';
/** Matches ScreenComponent screenContainer width ratio. */
export const SCREEN_CONTENT_WIDTH_RATIO = 1;

/** Design px authored at iPhone 17 Pro Max; use for one-off sizes. */
export const layout = {
  space2: vh(2),
  space4: vh(4),
  space6: vh(6),
  space8: vh(8),
  space10: vh(10),
  space12: vh(12),
  space14: vh(14),
  space16: vh(16),
  space20: vh(20),
  space24: vh(24),
  space28: vh(28),
  space32: vh(32),
  space36: vh(36),
  radius12: vh(12),
  radius15: vh(15),
  fontXs: vh(12),
  fontSm: vh(14),
  fontBase: vh(16),
  fontLg: vh(18),
  fontXl: vh(20),
  font2xl: vh(24),
  font3xl: vh(30),
  font5xl: vh(48),
  iconSm: vh(16),
  iconMd: vh(18),
  iconLg: vh(20),
  iconXl: vh(22),
  icon2xl: vh(24),
  iconCircle: vh(40),
  buttonMinHeight: vh(52),
  tileMinHeight: vh(80),
  stackGap: vh(16),
  footerLogo: vh(100),
  carouselHeight: vh(100),
  chevronSize: vh(28),
  padX16: padX(16),
  padX24: padX(32),
};

export const scrollViewClassName = 'flex-1 w-full';
export const scrollContentClassName = 'flex-grow items-center';
export const scrollContentStyle: ViewStyle = {
  paddingHorizontal: padX(32),
  paddingBottom: vh(16),
  paddingTop: vh(24),
  marginTop: vh(24),
};
export const contentStackClassName = 'w-full max-w-[336px] items-center';
export const stackGapStyle: ViewStyle = { gap: vh(16) };

export const cardClassName = 'border border-white/90 w-full';
export const cardStyle: ViewStyle = {
  borderRadius: vh(12),
  paddingVertical: vh(24),
  paddingHorizontal: padX(32),
};
/** RGBA values matching glassCardClassName (for StyleSheet). */
export const GLASS_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.1)';
export const GLASS_BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';
export const GLASS_BORDER_COLOR_ACTIVE = 'rgba(255, 255, 255, 0.6)';
/** Matches cardClassName border (more visible than glass cards). */
export const CARD_BORDER_COLOR = 'rgba(255, 255, 255, 0.9)';

/** Matches SubscriptionScreen planCard (glass panel). */
export const glassCardClassName = 'border border-white/20 bg-white/10 w-full';
export const glassCardStyle: ViewStyle = {
  borderRadius: vh(15),
  paddingVertical: vh(24),
  paddingHorizontal: padX(32),
  overflow: 'visible',
  flexShrink: 0,
  minHeight: 'auto',
};
export const glassCardCenteredClassName = `${glassCardClassName} items-center`;
export const glassInputClassName =
  'border-white/20 data-[hover=true]:border-white/20 data-[focus=true]:border-white/20';
export const HOME_TILE_PURPLE = '#3B1F5C';
export const homeActionTileTextClassName = 'text-[#3B1F5C] font-semibold';
export const homeActionTileTextStyle: TextStyle = { fontSize: vh(20) };
/** Large pressable tile on the home screen. */
export const glassActionTileClassName =
  'border border-[#3B1F5C]/15 bg-white w-full items-center justify-center active:opacity-80';
export const glassActionTileStyle: ViewStyle = {
  borderRadius: vh(15),
  minHeight: vh(80),
  paddingHorizontal: padX(32),
  paddingVertical: vh(20),
};
export const cardCenteredClassName = `${cardClassName} items-center`;
export const buttonTextClassName = 'text-white';
export const buttonTextStyle: TextStyle = { fontSize: vh(18) };
export const mutedTextClassName = 'text-white/75';
export const mutedTextStyle: TextStyle = { fontSize: vh(16) };

/** Home routine timeline (Hatch-inspired). */
export const homeScrollContentClassName = 'flex-grow items-center';
export const homeScrollContentStyle: ViewStyle = {
  paddingHorizontal: padX(32),
  paddingBottom: vh(16),
  paddingTop: vh(16),
  marginTop: vh(8),
};
export const homeContentStackClassName =
  'w-full max-w-[360px] items-stretch self-center';
export const homePageTitleClassName = 'text-white font-bold';
export const homePageTitleStyle: TextStyle = { fontSize: vh(30) };
export const homeHintClassName = 'text-white/75';
export const homeHintStyle: TextStyle = { fontSize: vh(14) };
export const homeSectionLabelClassName =
  'text-white/75 uppercase tracking-widest';
export const homeSectionLabelStyle: TextStyle = { fontSize: vh(12) };
export const homeRoutineCardClassName =
  'border border-white/20 bg-white/10 w-full flex-row items-center active:opacity-80';
export const homeRoutineCardStyle: ViewStyle = {
  borderRadius: vh(15),
  paddingVertical: vh(16),
  paddingHorizontal: padX(24),
};
export const soundTileClassName =
  'border border-white/90 bg-white/10 overflow-hidden items-center justify-between';
export const soundTileStyle: ViewStyle = {
  borderRadius: vh(15),
  padding: vh(10),
};
export const homeAddStepClassName = 'text-white/75';
export const homeAddStepStyle: TextStyle = {
  fontSize: vh(14),
  marginTop: vh(8),
  marginLeft: vh(16),
};

/** Timer section cards (Hatch-inspired). */
export const timerScrollContentClassName = homeScrollContentClassName;
export const timerScrollContentStyle = homeScrollContentStyle;
export const timerContentStackClassName = homeContentStackClassName;
export const timerPageTitleClassName = homePageTitleClassName;
export const timerPageTitleStyle = homePageTitleStyle;
export const timerHintClassName = homeHintClassName;
export const timerHintStyle = homeHintStyle;
export const timerSectionLabelClassName = 'text-white font-semibold';
export const timerSectionLabelStyle: TextStyle = {
  fontSize: vh(16),
  marginBottom: vh(12),
};
export const timerSettingRowClassName =
  'flex-row items-center justify-between border-t border-white/10';
export const timerSettingRowStyle: ViewStyle = {
  paddingVertical: vh(12),
};
export const timerOutlineButtonClassName =
  'w-full border border-white/30 items-center justify-center flex-row active:opacity-80';
export const timerPrimaryButtonClassName =
  'w-full border border-white/50 bg-white/30 items-center justify-center flex-row active:opacity-80';
export const timerSolidButtonClassName =
  'w-full border border-white bg-white items-center justify-center flex-row active:opacity-80';
export const timerButtonStyle: ViewStyle = {
  borderRadius: vh(15),
  paddingVertical: vh(16),
};
export const TIMER_SOLID_BUTTON_CONTENT_COLOR = '#63488b';
export const timerResetLinkClassName = 'text-white/75 text-center';
export const timerResetLinkStyle: TextStyle = {
  fontSize: vh(14),
  marginTop: vh(12),
};
export const timerSessionResetLinkClassName = 'text-white font-bold text-center';
export const timerSessionResetLinkStyle: TextStyle = {
  fontSize: vh(18),
  marginTop: vh(24),
};

export const textXlStyle: TextStyle = { fontSize: vh(20), fontWeight: '600' };
export const textLgStyle: TextStyle = { fontSize: vh(18), fontWeight: '600' };
export const textBaseStyle: TextStyle = { fontSize: vh(16), fontWeight: '600' };
export const textSmStyle: TextStyle = { fontSize: vh(14) };
export const fieldLabelStyle: TextStyle = {
  fontSize: vh(20),
  fontWeight: '600',
  marginRight: vh(8),
};
export const fieldInputStyle: TextStyle = {
  fontSize: vh(18),
  fontWeight: '600',
};
