import clsx from 'clsx';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function Rating({ label, value, onChange }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-800">{label}</p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{value}/5</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={clsx(
              'h-11 rounded-lg border text-sm font-bold transition hover:-translate-y-0.5',
              score <= value
                ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-teal-300'
            )}
            aria-label={`${label}: ${score}`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
