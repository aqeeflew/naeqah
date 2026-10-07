/**
 * Public surface of the template gallery UI. Routes import from here so that
 * moving a file inside `components/gallery/` never touches a route — the same
 * arrangement as `components/card/index.ts`.
 */
export { TemplatePreview, type TemplatePreviewProps } from './template-preview';
export { TemplateTile, type TemplateTileProps } from './template-tile';
