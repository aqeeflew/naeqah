/**
 * Public surface of the card renderer. Pages import from here so that moving a
 * file inside `components/card/` never touches a route.
 */
export { CardRenderer, type CardRendererProps } from './card-renderer';
export { cardStyle, backgroundStyle, googleFontsHref, hexToRgba } from './card-theme';
export { sectionRegistry, visibleSections, type SectionProps } from './card-sections';
export {
  displayName,
  formatCardDate,
  formatCardDateShort,
  formatCardTime,
  formatTimeRange,
  orderedCouple,
  parentsLine,
  partOfDay,
} from './card-format';
export { placeholderCardData } from './placeholder-card';
