import type { EvaluationFormData } from '../types/evaluation';

export function validateStep(step: number, data: EvaluationFormData) {
  const errors: Record<string, string> = {};
  const requireField = (key: keyof EvaluationFormData, label: string) => {
    if (!String(data[key] ?? '').trim()) errors[key] = `${label} es requerido`;
  };
  const requireMinLength = (key: keyof EvaluationFormData, label: string, minLength: number) => {
    const value = String(data[key] ?? '').trim();
    if (!value) {
      errors[key] = `${label} es requerido`;
      return;
    }

    if (value.length < minLength) {
      errors[key] = `${label} debe tener al menos ${minLength} caracteres`;
    }
  };

  if (step === 0) {
    requireField('fullName', 'El nombre completo');
    requireField('email', 'El correo');
    requireField('documentNumber', 'El documento');
    requireField('shift', 'La jornada');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Ingresa un correo valido';
    }
  }

  if (step === 1) {
    requireField('classProgram', 'El programa');
    requireField('classSemester', 'El semestre de la clase');
    requireField('subject', 'La asignatura');
    requireField('classStartTime', 'La hora de inicio');
    requireField('classEndTime', 'La hora de fin');
    requireField('classDate', 'La fecha de clase');
    requireField('professorName', 'El profesor');
    requireField('modality', 'La modalidad');
    if (data.classStartTime && data.classEndTime && data.classStartTime >= data.classEndTime) {
      errors.classEndTime = 'La hora fin debe ser mayor a la hora inicio';
    }
  }

  if (step === 3) {
    requireMinLength('bestPartComment', 'Lo mejor de la clase', 5);
    requireMinLength('improvementComment', 'Lo que podria mejorar', 5);
    requireMinLength('generalComment', 'El comentario general', 5);
    requireField('wouldRecommend', 'La recomendacion');
    requireMinLength('recommendationReason', 'La razon de recomendacion', 5);
  }

  return errors;
}

export function validateForm(data: EvaluationFormData) {
  return {
    ...validateStep(0, data),
    ...validateStep(1, data),
    ...validateStep(3, data)
  };
}
