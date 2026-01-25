export { default as PieRegister, registerComponent, isRegistered } from './PieRegister';
export type { PieRegisterOptions } from './PieRegister';

export {
    default as ComponentRegistry,
    componentRegistry
} from './ComponentRegistry';
export type { ComponentType, ComponentMetadata, PropSchema } from './ComponentRegistry';
export { extractPropsSchema, validateProps } from './ComponentRegistry';

export {
    DynamicComponent,
    useRegisteredComponent,
    useRegisteredComponents,
    useComponentsByCategory,
    createComponent,
    getComponentTypeInfo
} from './ComponentFactory';
export type { DynamicComponentProps } from './ComponentFactory';

// Build-time registry
export {
    AutoRegister,
    setBuildTimeComponents,
    getBuildTimeComponent,
    getAllBuildTimeComponents,
    hasBuildTimeComponent,
    scanComponentsInDirectory,
    COMPONENT_MAP
} from './BuildTimeRegistry';
export type { AutoRegisterableComponent, BuildTimeComponentMap } from './BuildTimeRegistry';

// Auto-generated components (импортируется для инициализации)
export { GENERATED_COMPONENT_MAP, GENERATED_COMPONENT_METADATA } from './GeneratedComponentMap';