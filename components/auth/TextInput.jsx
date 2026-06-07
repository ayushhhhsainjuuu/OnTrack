export default function TextInput({
  label,
  type = "text",
  name,
  placeholder,
  ...props
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0A3C86] focus:bg-white focus:ring-4 focus:ring-blue-100"
        {...props}
      />
    </div>
  );
}