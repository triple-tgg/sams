import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldError } from '@/components/ui/field-error'
import type { Option } from './types'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'

interface SelectFieldProps {
  name: string;
  control: any;
  label: string;
  placeholder: string;
  options: Option[];
  isLoading: boolean;
  error?: string;
  usingFallback?: boolean;
  errorMessage?: string;
}

export const SelectField = ({
  name,
  control,
  label,
  placeholder,
  options,
  isLoading,
  error,
  usingFallback,
  errorMessage
}: SelectFieldProps) => (
  <div className="space-y-1">
    <Label htmlFor={name}>{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        console.log("field", name, field.value?.value)
        return (
          <Select
            value={field.value?.value}
            onValueChange={(value) => {
              console.log("value", value)
              const option = options.find(opt => opt.value === value);
              field.onChange(option || null);
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? `Loading ${label.toLowerCase()}...` : placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {options.length === 0 && !isLoading && (
                <SelectItem value="" disabled>
                  {error ? `Failed to load ${label.toLowerCase()}` : `No ${label.toLowerCase()} found`}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )
      }}
    />
    <FieldError msg={errorMessage} />
    {usingFallback && (
      <p className="text-sm text-amber-600">
        ⚠️ Using offline {label.toLowerCase()} data due to API connection issue
      </p>
    )}
  </div>
);

interface StringSelectFieldProps {
  name: string;
  control: any;
  label: string;
  placeholder: string;
  options: Option[];
  isLoading: boolean;
  error?: string;
  usingFallback?: boolean;
  errorMessage?: string;
}

export const StringSelectField = ({
  name,
  control,
  label,
  placeholder,
  options,
  isLoading,
  error,
  usingFallback,
  errorMessage
}: StringSelectFieldProps) => (
  <div className="space-y-1">
    <Label htmlFor={name}>{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={field.value || ""}
          onValueChange={(value) => {
            field.onChange(value);
          }}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? `Loading ${label.toLowerCase()}...` : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            {options.length === 0 && !isLoading && (
              <SelectItem value="" disabled>
                {error ? `Failed to load ${label.toLowerCase()}` : `No ${label.toLowerCase()} found`}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}
    />
    <FieldError msg={errorMessage} />
    {usingFallback && (
      <p className="text-sm text-amber-600">
        ⚠️ Using offline {label.toLowerCase()} data due to API connection issue
      </p>
    )}
  </div>
);

interface InputFieldProps {
  name: string;
  control: any;
  label: string;
  placeholder?: string;
  type?: string;
  errorMessage?: string;
}

export const InputField = ({
  name,
  control,
  label,
  placeholder,
  type = "text",
  errorMessage
}: InputFieldProps) => (
  <div className="space-y-1">
    <Label htmlFor={name}>{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          value={field.value || ''}
          placeholder={placeholder}
          type={type}
        />
      )}
    />
    <FieldError msg={errorMessage} />
  </div>
);

interface TextareaFieldProps {
  register: any;
  name: string;
  label: string;
  placeholder?: string;
  errorMessage?: string;
}

export const TextareaField = ({
  register,
  name,
  label,
  placeholder,
  errorMessage
}: TextareaFieldProps) => (
  <div className="space-y-1">
    <Label htmlFor={name}>{label}</Label>
    <Textarea {...register(name)} placeholder={placeholder} />
    <FieldError msg={errorMessage} />
  </div>
);

interface InputFieldDateProps {
  name: string;
  control: any;
  label: string;
  placeholder: string;
  error?: string;
  usingFallback?: boolean;
  errorMessage?: string;
}
export const InputFieldDate = (props: InputFieldDateProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.name}>Date</Label>
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <CustomDateInput
            value={field.value}
            onChange={field.onChange}
            placeholder={props.placeholder}
          />
        )}
      />
      <FieldError msg={props.errorMessage} />
    </div>
  )
}