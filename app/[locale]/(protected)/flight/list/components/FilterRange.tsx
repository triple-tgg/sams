import { cn } from '@/lib/utils'
import dayjs from 'dayjs';
import React, { useState } from 'react'
import { Button } from 'react-day-picker';
import { DateRange } from "react-day-picker"
import { useFormContext } from 'react-hook-form';
type Props = {
  onClick: () => void;
  value?: DateRange;
}

const FilterRange = (props: Props) => {
  const [active, setActive] = useState("Day");
  const { setValue, } = useFormContext<{ dateRange: DateRange | undefined }>()
  const options = [
    {
      value: 'Day',
      label: 'Day',
      onClick: () => {
        const today = dayjs().toDate();
        const yesterday = dayjs().subtract(1, "day").toDate(); // Yesterday's date
        setValue("dateRange", { from: yesterday, to: today });
        setActive('Day');
        props.onClick();
      }
    },
    {
      value: 'Week',
      label: 'Week',
      onClick: () => {
        const startOfWeek = dayjs().startOf('week').toDate();
        const endOfWeek = dayjs().endOf('week').toDate();
        setValue("dateRange", { from: startOfWeek, to: endOfWeek });
        setActive('Week');
        props.onClick();
      }
    },
    {
      value: 'Month',
      label: 'Month',
      onClick: () => {
        const startOfMonth = dayjs().startOf('month').toDate();
        const endOfMonth = dayjs().endOf('month').toDate();
        setValue("dateRange", { from: startOfMonth, to: endOfMonth });
        setActive('Month');
        props.onClick();
      }
    }
  ]

  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-1 flex items-center bg-white dark:bg-slate-700/50">
      {options.map((option) => (
        <ButtonFilter key={option.value} value={option.value} onClick={option.onClick}
          active={active === option.value}
        />
      ))}
    </div>
  )
}

export default FilterRange

const ButtonFilter = (props: { active: boolean, value: string, onClick: () => void }) => {
  return (
    <span
      className={cn(
        "flex-1 text-xs font-medium px-3 py-1.5 transition-all duration-200 rounded-md cursor-pointer text-center whitespace-nowrap",
        "hover:bg-slate-100 dark:hover:bg-slate-600",
        {
          "bg-sky-500 text-white shadow-sm hover:bg-sky-600 dark:hover:bg-sky-600":
            !!props.active,
          "text-slate-600 dark:text-slate-300":
            !props.active,
        }
      )}
      onClick={props.onClick}
    >
      {props.value}
    </span>
  )
}