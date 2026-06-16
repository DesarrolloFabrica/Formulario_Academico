import clsx from 'clsx';

const steps = ['Estudiante', 'Clase', 'Evaluacion', 'Comentarios', 'Confirmacion'];

export function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="space-y-3">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-500"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-5 gap-1 text-center text-slate-500">
        {steps.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-col items-center gap-1">
            <span
              className={clsx(
                'grid h-7 w-7 place-items-center rounded-full border text-xs font-bold transition',
                index <= current
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 bg-white text-slate-500'
              )}
            >
              {index + 1}
            </span>
            <span
              className={clsx(
                'w-full truncate text-[10px] font-semibold leading-tight sm:text-[11px]',
                index <= current && 'text-teal-700'
              )}
              title={step}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
