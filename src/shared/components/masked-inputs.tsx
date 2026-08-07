import { useEffect, useState, type InputHTMLAttributes } from "react";
import { Input } from "@/shared/components/ui";
import { formatCpfCnpj, onlyDigits } from "@/shared/utils/document";
import {
  formatBrazilianCurrencyDraft,
  formatBrazilianCurrencyInput,
  parseBrazilianCurrency,
} from "@/shared/utils/formatters";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
};

export function CurrencyInput({ value, onChange, onBlur, onFocus, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const parsed = parseBrazilianCurrency(value);
    setDisplayValue(
      focused ? formatBrazilianCurrencyDraft(parsed) : formatBrazilianCurrencyInput(parsed),
    );
  }, [focused, value]);

  return (
    <Input
      {...props}
      inputMode="decimal"
      value={displayValue}
      onFocus={(event) => {
        setFocused(true);
        setDisplayValue(formatBrazilianCurrencyDraft(parseBrazilianCurrency(value)));
        onFocus?.(event);
        window.requestAnimationFrame(() => event.currentTarget.select());
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setDisplayValue(raw);
        onChange(parseBrazilianCurrency(raw));
      }}
      onBlur={(event) => {
        setFocused(false);
        setDisplayValue(formatBrazilianCurrencyInput(parseBrazilianCurrency(event.target.value)));
        onBlur?.(event);
      }}
    />
  );
}

type DocumentInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export function DocumentInput({ value, onChange, ...props }: DocumentInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      maxLength={18}
      value={formatCpfCnpj(value ?? "")}
      onChange={(event) => onChange(onlyDigits(event.target.value).slice(0, 14))}
    />
  );
}
