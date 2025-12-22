declare module 'next-themes' {
    import { ReactNode } from 'react';

    export interface ThemeProviderProps {
        children?: ReactNode;
        forcedTheme?: string;
        disableTransitionOnChange?: boolean;
        enableSystem?: boolean;
        enableColorScheme?: boolean;
        storageKey?: string;
        themes?: string[];
        defaultTheme?: string;
        attribute?: string | 'class';
        value?: Record<string, string>;
        nonce?: string;
    }

    export function ThemeProvider(props: ThemeProviderProps): JSX.Element;

    export interface UseThemeProps {
        themes: string[];
        forcedTheme?: string;
        setTheme: (theme: string) => void;
        theme?: string;
        resolvedTheme?: string;
        systemTheme?: 'dark' | 'light';
    }

    export function useTheme(): UseThemeProps;
}
