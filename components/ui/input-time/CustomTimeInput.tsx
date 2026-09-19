"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface CustomTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export const CustomTimeInput = React.forwardRef<HTMLInputElement, CustomTimeInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "--:--",
      className,
      disabled = false,
      id,
      name,
      autoFocus,
      onBlur,
      ...props
    },
    forwardedRef
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [typedValue, setTypedValue] = React.useState(value || "");

    const hourListRef = React.useRef<HTMLDivElement>(null);
    const minuteListRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setTypedValue(value || "");
    }, [value]);

    // Parse current hour and minute from value
    const [currentHour, currentMinute] = React.useMemo(() => {
      if (!value || typeof value !== "string") return ["", ""];
      const parts = value.split(":");
      return [parts[0] || "", parts[1] || ""];
    }, [value]);

    const emitValue = (newVal: string) => {
      setTypedValue(newVal);
      if (inputRef.current) {
        inputRef.current.value = newVal;
      }
      onChange?.(newVal);
    };

    // Scroll active items into view when popover opens
    React.useEffect(() => {
      if (isOpen) {
        const timer = setTimeout(() => {
          if (currentHour && hourListRef.current) {
            const el = hourListRef.current.querySelector(`[data-hour="${currentHour}"]`);
            el?.scrollIntoView({ block: "center", behavior: "auto" });
          }
          if (currentMinute && minuteListRef.current) {
            const el = minuteListRef.current.querySelector(`[data-minute="${currentMinute}"]`);
            el?.scrollIntoView({ block: "center", behavior: "auto" });
          }
        }, 30);
        return () => clearTimeout(timer);
      }
    }, [isOpen, currentHour, currentMinute]);

    // Handle typing with 24-hour mask (HH:mm)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digitsOnly = raw.replace(/\D/g, "").slice(0, 4);

      if (!digitsOnly) {
        emitValue("");
        return;
      }

      let formatted = "";
      if (digitsOnly.length <= 2) {
        const h = parseInt(digitsOnly, 10);
        if (h > 23) {
          formatted = "23";
        } else {
          formatted = digitsOnly;
        }
      } else {
        let hStr = digitsOnly.slice(0, 2);
        let mStr = digitsOnly.slice(2, 4);

        const h = parseInt(hStr, 10);
        if (h > 23) hStr = "23";

        const m = parseInt(mStr, 10);
        if (m > 59) mStr = "59";

        formatted = `${hStr}:${mStr}`;
      }

      emitValue(formatted);
    };

    const handleHourSelect = (h: string) => {
      const m = currentMinute || "00";
      emitValue(`${h}:${m}`);
    };

    const handleMinuteSelect = (m: string) => {
      const h = currentHour || "00";
      emitValue(`${h}:${m}`);
    };

    const handleSetNow = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      emitValue(`${h}:${m}`);
      setIsOpen(false);
    };

    const handleClear = () => {
      emitValue("");
      setIsOpen(false);
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative flex items-center">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof forwardedRef === "function") {
                forwardedRef(node);
              } else if (forwardedRef) {
                (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            maxLength={5}
            disabled={disabled}
            value={typedValue}
            onChange={handleInputChange}
            onBlur={onBlur}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 tracking-wider font-mono",
              className
            )}
            {...props}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Pick 24-hour time"
            >
              <Clock className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          align="start"
          sideOffset={5}
          className="w-56 p-2 shadow-lg border rounded-lg bg-popover z-[9999]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-border mb-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              24-Hour Time (HH:mm)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSetNow}
                className="text-[11px] font-medium text-primary hover:underline px-1 py-0.5 rounded"
              >
                Now
              </button>
              {typedValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-red-500 hover:underline px-1 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Time Picker Columns (24h: Hours 00-23 and Minutes 00-59) */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            {/* Hours Column */}
            <div>
              <div className="font-semibold text-[11px] text-muted-foreground pb-1 border-b border-border/50 mb-1">
                Hour (00-23)
              </div>
              <div
                ref={hourListRef}
                className="h-44 overflow-y-auto space-y-1 pr-1 scrollbar-thin"
              >
                {HOURS.map((h) => {
                  const isSelected = currentHour === h;
                  return (
                    <button
                      key={h}
                      data-hour={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={cn(
                        "w-full h-7 rounded text-xs transition-colors flex items-center justify-center font-mono",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:bg-accent text-foreground hover:text-accent-foreground"
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <div className="font-semibold text-[11px] text-muted-foreground pb-1 border-b border-border/50 mb-1">
                Minute (00-59)
              </div>
              <div
                ref={minuteListRef}
                className="h-44 overflow-y-auto space-y-1 pr-1 scrollbar-thin"
              >
                {MINUTES.map((m) => {
                  const isSelected = currentMinute === m;
                  return (
                    <button
                      key={m}
                      data-minute={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={cn(
                        "w-full h-7 rounded text-xs transition-colors flex items-center justify-center font-mono",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:bg-accent text-foreground hover:text-accent-foreground"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer with selected display & Done button */}
          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between px-1">
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
              {typedValue ? `${typedValue} hrs` : "--:--"}
            </span>
            <Button
              type="button"
              size="sm"
              className="h-6 px-2.5 text-xs"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

CustomTimeInput.displayName = "CustomTimeInput";
