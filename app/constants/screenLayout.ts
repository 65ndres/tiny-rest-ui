export const SCREEN_TOP_HEIGHT = '10%';
export const SCREEN_CONTENT_HEIGHT = '75%';
export const SCREEN_FOOTER_HEIGHT = '15%';
/** Matches ScreenComponent screenContainer width ratio. */
export const SCREEN_CONTENT_WIDTH_RATIO = 0.84;

export const scrollViewClassName = 'flex-1 w-full';
export const scrollContentClassName =
  'flex-grow items-center px-6 pb-4 pt-6 mt-6';
export const contentStackClassName = 'w-full max-w-[336px] items-center';
export const cardClassName = 'rounded-xl border border-white/90 p-6 w-full';
/** RGBA values matching glassCardClassName (for StyleSheet). */
export const GLASS_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.1)';
export const GLASS_BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';
export const GLASS_BORDER_COLOR_ACTIVE = 'rgba(255, 255, 255, 0.6)';

/** Matches SubscriptionScreen planCard (glass panel). */
export const glassCardClassName =
  'rounded-[15px] border border-white/20 bg-white/10 p-6 w-full';
export const glassCardCenteredClassName =
  'rounded-[15px] border border-white/20 bg-white/10 p-6 w-full items-center';
export const glassInputClassName =
  'border-white/20 data-[hover=true]:border-white/20 data-[focus=true]:border-white/20';
export const HOME_TILE_PURPLE = '#3B1F5C';
export const homeActionTileTextClassName = 'text-[#3B1F5C] text-xl font-semibold';
/** Large pressable tile on the home screen. */
export const glassActionTileClassName =
  'rounded-[15px] border border-[#3B1F5C]/15 bg-white w-full min-h-[80px] px-6 py-5 items-center justify-center active:opacity-80';
export const cardCenteredClassName =
  'rounded-xl border border-white/90 p-6 w-full items-center';
export const buttonTextClassName = 'text-white text-lg';
export const mutedTextClassName = 'text-white/75 text-base';

/** Home routine timeline (Hatch-inspired). */
export const homeScrollContentClassName =
  'flex-grow items-start px-6 pb-4 pt-4 mt-2';
export const homeContentStackClassName = 'w-full max-w-[360px] items-start';
export const homePageTitleClassName = 'text-white text-3xl font-bold';
export const homeHintClassName = 'text-white/75 text-sm';
export const homeSectionLabelClassName =
  'text-white/75 text-xs uppercase tracking-widest';
export const homeRoutineCardClassName =
  'rounded-[15px] border border-white/20 bg-white/10 p-4 w-full flex-row items-center active:opacity-80';
export const homeAddStepClassName = 'text-white/75 text-sm mt-2 ml-4';

/** Timer section cards (Hatch-inspired). */
export const timerScrollContentClassName = homeScrollContentClassName;
export const timerContentStackClassName = homeContentStackClassName;
export const timerPageTitleClassName = homePageTitleClassName;
export const timerHintClassName = homeHintClassName;
export const timerSectionLabelClassName = 'text-white text-base font-semibold mb-3';
export const timerSettingRowClassName =
  'flex-row items-center justify-between py-3 border-t border-white/10';
export const timerOutlineButtonClassName =
  'w-full rounded-[15px] border border-white/30 py-4 items-center justify-center flex-row active:opacity-80';
export const timerPrimaryButtonClassName =
  'w-full rounded-[15px] border border-white/50 bg-white/30 py-4 items-center justify-center flex-row active:opacity-80';
export const timerResetLinkClassName = 'text-white/75 text-sm text-center mt-3';
export const timerSessionResetLinkClassName =
  'text-white/75 text-base text-center mt-3';
