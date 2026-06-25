export default function PasswordInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  required = false,
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>

      <input
        type="password"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0A3C86] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}