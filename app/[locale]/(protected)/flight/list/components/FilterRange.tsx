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
        setValue("dateRange", { from: today, to: today });
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
    <div className="border border-default-200 dark:border-default-300  rounded p-1 flex items-center bg-background">
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
    // <Button>ButtonFilter</Button>
    <span
      className={cn(
        "flex-1 text-sm font-normal px-3 py-1 transition-all duration-150 rounded cursor-pointer",
        {
          "bg-default-900 text-primary-foreground dark:bg-default-300 dark:text-foreground ":
            !!props.active,
        }
      )}
      onClick={props.onClick}
    >
      {props.value}
    </span>
  )
}