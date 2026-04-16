type NumberInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  step?: number;
  className?: string;
};

export function NumberInput({
  value,
  onChange,
  min = 0,
  step = 1,
  className = "",
}: NumberInputProps) {
  return (
    <input
      className={`rounded-2xl border border-stone-300 bg-white/90 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 ${className}`}
      type="number"
      min={min}
      step={step}
      value={value ?? ""}
      onChange={(event) => {
        const nextValue = event.target.value;
        onChange(nextValue === "" ? null : Number(nextValue));
      }}
    />
  );
}
