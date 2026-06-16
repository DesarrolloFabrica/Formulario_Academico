import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, LogOut, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InputField, SelectField, TextAreaField } from '../components/Field';
import { ProgressSteps } from '../components/ProgressSteps';
import { Rating } from '../components/Rating';
import { checkEvaluationAvailability, createEvaluation, getCatalogs } from '../services/api';
import type { CatalogOption, Catalogs, EvaluationFormData, User } from '../types/evaluation';
import { validateStep } from '../utils/validation';

const emptyForm = (user: User): EvaluationFormData => ({
  fullName: user.name,
  email: user.email,
  documentNumber: '',
  academicProgram: '',
  semester: '',
  shift: '',
  classProgram: '',
  classSemester: '',
  subject: '',
  classSchedule: '',
  classStartTime: '',
  classEndTime: '',
  classDate: new Date().toISOString().slice(0, 10),
  professorName: '',
  modality: 'Presencial',
  campusOrRoom: '',
  virtualClassLink: '',
  clarityRating: 4,
  topicMasteryRating: 4,
  punctualityRating: 4,
  classDynamicsRating: 4,
  resourcesRating: 4,
  interactionRating: 4,
  overallRating: 4,
  bestPartComment: '',
  improvementComment: '',
  generalComment: '',
  wouldRecommend: true,
  recommendationReason: ''
});

const fallbackAvatar = '/avatar.svg';

const emptyCatalogs: Catalogs = {
  programs: [],
  semesters: [],
  subjects: [],
  schedules: [],
  professors: [],
  modalities: [],
  campuses: [],
  shifts: []
};

function renderOptions(options: CatalogOption[], placeholder: string) {
  return (
    <>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.name}>
          {option.name}
        </option>
      ))}
    </>
  );
}

type Props = {
  user: User;
  onLogout: () => void;
  onAdmin: () => void;
};

export function FormPage({ user, onLogout, onAdmin }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => emptyForm(user));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [apiError, setApiError] = useState('');
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  const [catalogError, setCatalogError] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  useEffect(() => {
    getCatalogs()
      .then((data) => {
        setCatalogs(data.catalogs);
        setCatalogError('');
        const defaultModality = data.catalogs.modalities[0]?.name;
        if (defaultModality && ['Presencial', 'Virtual', 'Hibrida'].includes(defaultModality)) {
          setForm((current) => ({ ...current, modality: defaultModality as EvaluationFormData['modality'] }));
        }
      })
      .catch(() => setCatalogError('No fue posible cargar las listas de la base de datos'));
  }, []);

  useEffect(() => {
    if (!form.classProgram || !form.classSemester) {
      setCatalogs((current) => ({ ...current, subjects: [] }));
      return;
    }

    getCatalogs({ program: form.classProgram, semester: form.classSemester })
      .then((data) => {
        setCatalogs((current) => ({ ...current, subjects: data.catalogs.subjects }));
        setCatalogError('');
      })
      .catch(() => setCatalogError('No fue posible cargar las materias para el programa y semestre seleccionados'));
  }, [form.classProgram, form.classSemester]);

  useEffect(() => {
    if (!form.classProgram || !form.classSemester || !form.subject || !form.professorName || !form.classDate) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('');
      return;
    }

    let isCurrent = true;
    setAvailabilityStatus('checking');
    setAvailabilityMessage('');

    checkEvaluationAvailability({
      subject: form.subject,
      professorName: form.professorName,
      classDate: form.classDate
    })
      .then((data) => {
        if (!isCurrent) return;
        setAvailabilityStatus(data.available ? 'available' : 'duplicate');
        setAvailabilityMessage(data.message ?? '');
      })
      .catch(() => {
        if (!isCurrent) return;
        setAvailabilityStatus('idle');
        setAvailabilityMessage('No fue posible validar si esta evaluacion ya existe');
      });

    return () => {
      isCurrent = false;
    };
  }, [form.classProgram, form.classSemester, form.subject, form.professorName, form.classDate]);

  const update = <K extends keyof EvaluationFormData>(key: K, value: EvaluationFormData[K]) => {
    setForm((current) => {
      const nextForm = { ...current, [key]: value };

      if (key === 'classProgram') nextForm.academicProgram = String(value);
      if (key === 'classSemester') nextForm.semester = String(value);
      if (key === 'classProgram' || key === 'classSemester') nextForm.subject = '';

      return nextForm;
    });
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const next = () => {
    const stepErrors = validateStep(step, form);
    setErrors(stepErrors);
    if (step === 1 && availabilityStatus === 'duplicate') return;
    if (Object.keys(stepErrors).length === 0) setStep((current) => Math.min(current + 1, 4));
  };

  const submit = async () => {
    setApiError('');
    const stepErrors = validateStep(3, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    setStatus('sending');
    try {
      await createEvaluation({
        ...form,
        academicProgram: form.classProgram,
        semester: form.classSemester,
        classSchedule: `${form.classStartTime} - ${form.classEndTime}`
      });
      setStatus('success');
      setStep(4);
    } catch (error) {
      setStatus('idle');
      setApiError(error instanceof Error ? error.message : 'Error enviando la evaluacion');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.picture || fallbackAvatar}
              alt=""
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
              className="h-12 w-12 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <p className="text-sm font-medium text-slate-500">Sesion activa</p>
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {user.role === 'admin' && (
              <button onClick={onAdmin} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100">
                <ClipboardCheck size={18} /> Admin
              </button>
            )}
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700">
              <LogOut size={18} /> Salir
            </button>
          </div>
        </header>

        <div>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
            <div className="p-5 transition-all duration-300 md:p-8">
              {step === 0 && (
                <div className="animate-[fadeIn_.25s_ease] space-y-5">
                  <h2 className="text-2xl font-bold">Datos del estudiante</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Nombre completo" value={form.fullName} error={errors.fullName} onChange={(e) => update('fullName', e.target.value)} />
                    <InputField label="Correo electronico" type="email" value={form.email} error={errors.email} onChange={(e) => update('email', e.target.value)} />
                    <InputField label="Cedula/documento" value={form.documentNumber} error={errors.documentNumber} onChange={(e) => update('documentNumber', e.target.value)} />
                    <SelectField label="Jornada" value={form.shift} onChange={(e) => update('shift', e.target.value)}>
                      {renderOptions(catalogs.shifts, 'Selecciona una jornada')}
                    </SelectField>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="animate-[fadeIn_.25s_ease] space-y-5">
                  <h2 className="text-2xl font-bold">Datos de la clase</h2>
                  <SelectField label="Modalidad de la clase" value={form.modality} onChange={(e) => update('modality', e.target.value as EvaluationFormData['modality'])}>
                    {renderOptions(catalogs.modalities, 'Selecciona una modalidad')}
                  </SelectField>
                  {catalogError && <p className="rounded-lg bg-rose-50 p-3 font-medium text-rose-700">{catalogError}</p>}
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField label="Programa" value={form.classProgram} error={errors.classProgram} onChange={(e) => update('classProgram', e.target.value)}>
                      {renderOptions(catalogs.programs, 'Selecciona un programa')}
                    </SelectField>
                    <SelectField label="Semestre" value={form.classSemester} error={errors.classSemester} onChange={(e) => update('classSemester', e.target.value)}>
                      {renderOptions(catalogs.semesters, 'Selecciona un semestre')}
                    </SelectField>
                    <SelectField label="Materia/asignatura" value={form.subject} error={errors.subject} onChange={(e) => update('subject', e.target.value)}>
                      {renderOptions(catalogs.subjects, form.classProgram && form.classSemester ? 'Selecciona una materia' : 'Primero selecciona programa y semestre')}
                    </SelectField>
                    <InputField label="Hora inicio" type="time" value={form.classStartTime} error={errors.classStartTime} onChange={(e) => update('classStartTime', e.target.value)} />
                    <InputField label="Hora fin" type="time" value={form.classEndTime} error={errors.classEndTime} onChange={(e) => update('classEndTime', e.target.value)} />
                    <InputField label="Fecha de clase" type="date" value={form.classDate} error={errors.classDate} onChange={(e) => update('classDate', e.target.value)} />
                    <SelectField label="Nombre del profesor" value={form.professorName} error={errors.professorName} onChange={(e) => update('professorName', e.target.value)}>
                      {renderOptions(catalogs.professors, 'Selecciona un profesor')}
                    </SelectField>
                    {form.modality !== 'Virtual' && (
                      <SelectField label="Sede" value={form.campusOrRoom} onChange={(e) => update('campusOrRoom', e.target.value)}>
                        {renderOptions(catalogs.campuses, 'Selecciona una sede')}
                      </SelectField>
                    )}
                  </div>
                  {availabilityStatus === 'checking' && (
                    <p className="rounded-lg bg-slate-50 p-3 font-medium text-slate-600">Validando si ya calificaste esta materia...</p>
                  )}
                  {availabilityStatus === 'duplicate' && (
                    <p className="rounded-lg bg-rose-50 p-3 font-medium text-rose-700">
                      {availabilityMessage || 'Ya calificaste esta materia con este profesor en esta fecha'}
                    </p>
                  )}
                  {availabilityStatus === 'available' && (
                    <p className="rounded-lg bg-teal-50 p-3 font-medium text-teal-700">Puedes continuar con esta evaluacion.</p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="animate-[fadeIn_.25s_ease] space-y-5">
                  <h2 className="text-2xl font-bold">Evaluacion de la experiencia</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Rating label="Claridad del profesor" value={form.clarityRating} onChange={(value) => update('clarityRating', value)} />
                    <Rating label="Dominio del tema" value={form.topicMasteryRating} onChange={(value) => update('topicMasteryRating', value)} />
                    <Rating label="Puntualidad" value={form.punctualityRating} onChange={(value) => update('punctualityRating', value)} />
                    <Rating label="Dinamica de la clase" value={form.classDynamicsRating} onChange={(value) => update('classDynamicsRating', value)} />
                    <Rating label="Uso de recursos" value={form.resourcesRating} onChange={(value) => update('resourcesRating', value)} />
                    <Rating label="Participacion e interaccion" value={form.interactionRating} onChange={(value) => update('interactionRating', value)} />
                    <Rating label="Satisfaccion general" value={form.overallRating} onChange={(value) => update('overallRating', value)} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-[fadeIn_.25s_ease] space-y-5">
                  <h2 className="text-2xl font-bold">Comentarios</h2>
                  <TextAreaField label="Que fue lo mejor de la clase" value={form.bestPartComment} error={errors.bestPartComment} onChange={(e) => update('bestPartComment', e.target.value)} />
                  <TextAreaField label="Que podria mejorar" value={form.improvementComment} error={errors.improvementComment} onChange={(e) => update('improvementComment', e.target.value)} />
                  <TextAreaField label="Comentario general" value={form.generalComment} error={errors.generalComment} onChange={(e) => update('generalComment', e.target.value)} />
                  <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <SelectField label="Recomendarias esta clase o profesor" value={String(form.wouldRecommend)} onChange={(e) => update('wouldRecommend', e.target.value === 'true')}>
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </SelectField>
                    <TextAreaField label="Por que" value={form.recommendationReason} error={errors.recommendationReason} onChange={(e) => update('recommendationReason', e.target.value)} />
                  </div>
                  {apiError && <p className="rounded-lg bg-rose-50 p-3 font-medium text-rose-700">{apiError}</p>}
                </div>
              )}

              {step === 4 && (
                <div className="flex min-h-[360px] animate-[fadeIn_.25s_ease] flex-col items-center justify-center text-center">
                  <CheckCircle2 className="mb-4 text-teal-500" size={72} />
                  <h2 className="text-3xl font-extrabold">Evaluacion registrada</h2>
                  <p className="mt-3 max-w-xl leading-7 text-slate-600">
                    Gracias por compartir tu experiencia. Tus respuestas quedaron asociadas a tu cuenta y ayudaran a mejorar el seguimiento academico.
                  </p>
                  <button
                    onClick={() => {
                      setForm(emptyForm(user));
                      setStatus('idle');
                      setStep(0);
                    }}
                    className="mt-8 rounded-lg bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700"
                  >
                    Crear otra evaluacion
                  </button>
                </div>
              )}
            </div>

            {step < 4 && (
              <footer className="border-t border-slate-200 bg-slate-50 p-5">
                <ProgressSteps current={step} />
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    disabled={step === 0}
                    onClick={() => setStep((current) => Math.max(current - 1, 0))}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={18} /> Anterior
                  </button>
                  {step < 3 ? (
                    <button
                      onClick={next}
                      disabled={step === 1 && (availabilityStatus === 'checking' || availabilityStatus === 'duplicate')}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Siguiente <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={submit}
                      disabled={status === 'sending'}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                    >
                      {status === 'sending' ? 'Enviando...' : 'Enviar evaluacion'} <Send size={18} />
                    </button>
                  )}
                </div>
              </footer>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
