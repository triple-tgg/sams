declare module "next-intl" {
  export function useTranslations(
    namespace?: string
  ): (key: string, values?: Record<string, unknown>) => string;

  export function useLocale(): string;

  export function useNow(): Date;

  export function useTimeZone(): string;

  export function useFormatter(): {
    dateTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
    number: (value: number, options?: Intl.NumberFormatOptions) => string;
    relativeTime: (date: Date, now?: Date) => string;
    list: (value: Iterable<string>, options?: Intl.ListFormatOptions) => string;
  };

  export function useMessages(): Record<string, unknown>;

  export { default as NextIntlClientProvider } from "next-intl/dist/types/index.react-client";
}
