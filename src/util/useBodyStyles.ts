import { useEffect } from 'react';

type CSSStyleDeclarationKey = keyof CSSStyleDeclaration;
type StyleValue = string | null;

export function useBodyStyles(styles: Partial<Record<CSSStyleDeclarationKey, StyleValue>>) {
    useEffect(() => {
        if (!styles || typeof document === 'undefined') return () => {};

        const original: Partial<Record<CSSStyleDeclarationKey, StyleValue>> = {};

        for (const [key, value] of Object.entries(styles)) {
            const styleKey = key as CSSStyleDeclarationKey;
            original[styleKey] = document.body.style[styleKey] as StyleValue;
            if (value !== null && value !== undefined) {
                (document.body.style as any)[styleKey] = value;
            }
        }

        return () => {
            if (typeof document === 'undefined') return;

            for (const [key, value] of Object.entries(original)) {
                if (value !== null && value !== undefined) {
                    (document.body.style as any)[key] = value;
                } else {
                    (document.body.style as any)[key] = '';
                }
            }
        };
    }, [styles]);
}
