type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      className="rounded-2xl border border-stone-300 bg-white/90 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
