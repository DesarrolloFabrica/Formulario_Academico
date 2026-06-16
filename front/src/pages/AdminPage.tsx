import { ArrowLeft, BarChart3, BookOpen, CalendarDays, MessageSquareText, Star, ThumbsUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getAdminDashboard } from '../services/api';
import type { AdminDashboard } from '../types/evaluation';

const emptyDashboard: AdminDashboard = {
  summary: {
    totalEvaluations: 0,
    totalProfessors: 0,
    totalSubjects: 0,
    averageOverall: 0,
    averageClarity: 0,
    averageTopicMastery: 0,
    averagePunctuality: 0,
    averageClassDynamics: 0,
    averageResources: 0,
    averageInteraction: 0,
    recommendationRate: 0
  },
  professorRankings: [],
  subjectStats: [],
  evaluations: []
};

const formatNumber = (value: number) => value.toFixed(1);
const formatPercent = (value: number) => `${Math.round(value)}%`;

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Star }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <Icon size={22} />
        </span>
      </div>
    </article>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-950">{formatNumber(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min((value / 5) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

export function AdminPage({ onBack }: { onBack: () => void }) {
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboard()
      .then((data) => setDashboard(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'No fue posible cargar el panel administrativo'))
      .finally(() => setLoading(false));
  }, []);

  const recentComments = useMemo(() => dashboard.evaluations.slice(0, 30), [dashboard.evaluations]);
  const topProfessorScore = dashboard.professorRankings[0]?.averageOverall ?? 5;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100">
              <ArrowLeft size={18} /> Volver
            </button>
            <h1 className="text-3xl font-extrabold">Panel administrativo</h1>
            <p className="mt-2 text-slate-600">Resultados globales, ranking de profesores, estadisticas y comentarios.</p>
          </div>
        </header>

        {loading && <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Cargando analisis...</p>}
        {error && <p className="rounded-xl bg-rose-50 p-6 font-medium text-rose-700">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Evaluaciones" value={dashboard.summary.totalEvaluations} icon={BarChart3} />
              <StatCard label="Profesores" value={dashboard.summary.totalProfessors} icon={Users} />
              <StatCard label="Materias" value={dashboard.summary.totalSubjects} icon={BookOpen} />
              <StatCard label="Recomendacion" value={formatPercent(dashboard.summary.recommendationRate)} icon={ThumbsUp} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Promedios generales</h2>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                    <Star size={16} /> {formatNumber(dashboard.summary.averageOverall)}/5
                  </span>
                </div>
                <div className="space-y-4">
                  <RatingBar label="Claridad" value={dashboard.summary.averageClarity} />
                  <RatingBar label="Dominio del tema" value={dashboard.summary.averageTopicMastery} />
                  <RatingBar label="Puntualidad" value={dashboard.summary.averagePunctuality} />
                  <RatingBar label="Dinamica" value={dashboard.summary.averageClassDynamics} />
                  <RatingBar label="Recursos" value={dashboard.summary.averageResources} />
                  <RatingBar label="Interaccion" value={dashboard.summary.averageInteraction} />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">Ranking de profesores</h2>
                <div className="space-y-3">
                  {dashboard.professorRankings.map((professor, index) => (
                    <article key={professor.professorName} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-teal-700">#{index + 1}</p>
                          <h3 className="font-bold text-slate-950">{professor.professorName}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">{formatNumber(professor.averageOverall)}/5</span>
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{professor.totalEvaluations} respuestas</span>
                          <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-700">{formatPercent(professor.recommendationRate)} recomienda</span>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min((professor.averageOverall / Math.max(topProfessorScore, 1)) * 100, 100)}%` }} />
                      </div>
                    </article>
                  ))}
                  {dashboard.professorRankings.length === 0 && <p className="text-slate-600">Aun no hay profesores evaluados.</p>}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">Materias con mas respuestas</h2>
                <div className="space-y-3">
                  {dashboard.subjectStats.map((subject) => (
                    <article key={subject.subject} className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold">{subject.subject}</h3>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700">{subject.totalEvaluations}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">Promedio {formatNumber(subject.averageOverall)}/5</p>
                    </article>
                  ))}
                  {dashboard.subjectStats.length === 0 && <p className="text-slate-600">Aun no hay materias registradas.</p>}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <MessageSquareText className="text-teal-700" size={22} />
                  <h2 className="text-xl font-bold">Comentarios recientes</h2>
                </div>
                <div className="grid gap-4">
                  {recentComments.map((evaluation) => (
                    <article key={evaluation.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-bold">{evaluation.professorName}</h3>
                          <p className="text-sm text-slate-600">{evaluation.subject} - {evaluation.fullName} ({evaluation.email})</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700">
                          <CalendarDays size={15} /> {evaluation.classDate}
                        </span>
                      </div>
                      <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                        <p><strong>Mejor:</strong> {evaluation.bestPartComment}</p>
                        <p><strong>Mejora:</strong> {evaluation.improvementComment}</p>
                        <p><strong>General:</strong> {evaluation.generalComment}</p>
                      </div>
                      <p className="mt-3 text-sm text-slate-700"><strong>Recomendacion:</strong> {evaluation.wouldRecommend ? 'Si' : 'No'} - {evaluation.recommendationReason}</p>
                    </article>
                  ))}
                  {recentComments.length === 0 && <p className="text-slate-600">Aun no hay comentarios registrados.</p>}
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
