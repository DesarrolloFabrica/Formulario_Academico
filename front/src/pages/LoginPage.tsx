import { GoogleLogin } from '@react-oauth/google';
import { GraduationCap, ShieldCheck } from 'lucide-react';

type Props = {
  onLogin: (credential: string) => Promise<void>;
  error?: string;
};

export function LoginPage({ onLogin, error }: Props) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d9f99d_0,#f8fafc_34%,#e0f2fe_100%)] px-4 py-8 text-slate-900">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
            <GraduationCap size={18} />
            Formulario Academico
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-slate-950 md:text-6xl">
            Evalua tu clase con una experiencia clara, rapida y trazable.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Registra percepcion del profesor, modalidad, recursos y comentarios en un flujo pensado para estudiantes y reportes academicos.
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/85 p-6 shadow-soft backdrop-blur">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <ShieldCheck />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ingreso institucional</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Usa Google para capturar tu identidad y continuar con el formulario.</p>
            </div>
          </div>
          <GoogleLogin
            onSuccess={(response) => response.credential && onLogin(response.credential)}
            onError={() => undefined}
            width="100%"
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
          {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
        </div>
      </section>
    </main>
  );
}
