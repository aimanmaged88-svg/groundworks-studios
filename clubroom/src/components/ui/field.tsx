import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[var(--r-md)] bg-input border border-line-strong px-4 py-3 text-[16px] text-ink placeholder:text-ink-dim transition-colors duration-200 focus:border-club focus:outline-none disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="eyebrow">
        {label}
        {required && <span className="text-club"> *</span>}
      </label>
      {children}
      {error ? <p className="text-[12.5px] text-danger">{error}</p> : hint ? <p className="text-[12.5px] text-ink-dim">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "resize-none leading-relaxed", className)} rows={3} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
    </div>
  );
});

/** A large tappable checkbox card, used for consents. */
export function CheckCard({
  name,
  title,
  text,
  required,
  defaultChecked,
  checked,
  onChange,
}: {
  name: string;
  title: ReactNode;
  text?: ReactNode;
  required?: boolean;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3.5 rounded-[var(--r-md)] border border-line bg-input p-4 transition-colors duration-200 has-[:checked]:border-ok/50 has-[:checked]:bg-ok/8">
      <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border-2 border-line-strong transition-colors duration-200 group-has-[:checked]:border-ok group-has-[:checked]:bg-ok">
        <input
          type="checkbox"
          name={name}
          value="yes"
          required={required}
          defaultChecked={defaultChecked}
          checked={checked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
          className="peer absolute inset-0 cursor-pointer opacity-0"
        />
        <Check className="size-3.5 text-bg opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3.5} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-ink">
          {title}
          {required && <span className="text-club"> *</span>}
        </span>
        {text && <span className="text-[12.5px] leading-relaxed text-ink-muted">{text}</span>}
      </span>
    </label>
  );
}
