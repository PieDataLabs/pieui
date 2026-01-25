export { PieCard, type PieCardProps, type PieCardData } from './components';

// Simple Component Registry System
export {
    PieRegister,
    pieRegistry,
    createPieComponent
} from './registry/SimpleComponentRegistry';
export type { ComponentType } from './registry/SimpleComponentRegistry';

// Simple UI Renderer
export { default as SimpleUIRenderer } from './components/UI/SimpleUIRenderer';

// Make PieRegister the default export for convenience
export { default } from './registry/SimpleComponentRegistry';
