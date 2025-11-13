import React, { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

export type MinimalEvent = {
  target: {
    closest: (selector: string) => Element | null;
  };
};

export interface DatePickerProps {
  value: string;
  onChange: (
    value: string,
    event?: MinimalEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  placeholder?: string;
  dateFormat?: string;
  allowInput?: boolean;
  className?: string;
  validationClass?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select a date',
  dateFormat = 'Y-m-d',
  allowInput = true,
  className = '',
  validationClass = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (inputRef.current && !flatpickrRef.current) {
      flatpickrRef.current = flatpickr(inputRef.current, {
        dateFormat,
        allowInput,
        onChange: (_, dateStr) => {
          const syntheticEvent: MinimalEvent = {
            target: {
              closest: () => null,
            },
          };
          onChange(dateStr, syntheticEvent);
        },
      });
    }

    if (flatpickrRef.current) {
      if (value) flatpickrRef.current.setDate(value);
    }

    return () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy();
        flatpickrRef.current = null;
      }
    };
  }, [onChange, value, dateFormat, allowInput]);

  useEffect(() => {
    if (flatpickrRef.current && value !== (flatpickrRef.current.input as HTMLInputElement).value) {
      flatpickrRef.current.setDate(value || '');
    }
  }, [value]);

  return (
    <div className="input-group input-group-static mb-4">
      <span className="input-group-text">
        <i className="material-icons">calendar_today</i>
      </span>
      <input
        ref={inputRef}
        className={`form-control datepicker ${className} ${validationClass}`}
        placeholder={placeholder}
        type="text"
        value={value}
        readOnly
      />
    </div>
  );
};

export default DatePicker;
