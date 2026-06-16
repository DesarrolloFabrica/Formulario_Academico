export type User = {
  id: number;
  googleId: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  picture: string | null;
};

export type EvaluationFormData = {
  fullName: string;
  email: string;
  documentNumber: string;
  academicProgram: string;
  semester: string;
  shift: string;
  classProgram: string;
  classSemester: string;
  subject: string;
  classSchedule: string;
  classStartTime: string;
  classEndTime: string;
  classDate: string;
  professorName: string;
  modality: 'Presencial' | 'Virtual' | 'Hibrida';
  campusOrRoom: string;
  virtualClassLink: string;
  clarityRating: number;
  topicMasteryRating: number;
  punctualityRating: number;
  classDynamicsRating: number;
  resourcesRating: number;
  interactionRating: number;
  overallRating: number;
  bestPartComment: string;
  improvementComment: string;
  generalComment: string;
  wouldRecommend: boolean;
  recommendationReason: string;
};

export type CatalogOption = {
  id: number;
  name: string;
};

export type Catalogs = {
  programs: CatalogOption[];
  semesters: CatalogOption[];
  subjects: CatalogOption[];
  schedules: CatalogOption[];
  professors: CatalogOption[];
  modalities: CatalogOption[];
  campuses: CatalogOption[];
  shifts: CatalogOption[];
};

export type Evaluation = EvaluationFormData & {
  id: number;
  submittedAt: string;
  createdAt: string;
  googleEmail?: string;
  userName?: string;
};

export type EvaluationSummary = {
  totalEvaluations: number;
  totalProfessors: number;
  totalSubjects: number;
  averageOverall: number;
  averageClarity: number;
  averageTopicMastery: number;
  averagePunctuality: number;
  averageClassDynamics: number;
  averageResources: number;
  averageInteraction: number;
  recommendationRate: number;
};

export type ProfessorRanking = {
  professorName: string;
  totalEvaluations: number;
  averageOverall: number;
  averageClarity: number;
  averageTopicMastery: number;
  averagePunctuality: number;
  recommendationRate: number;
};

export type SubjectStat = {
  subject: string;
  totalEvaluations: number;
  averageOverall: number;
};

export type AdminDashboard = {
  summary: EvaluationSummary;
  professorRankings: ProfessorRanking[];
  subjectStats: SubjectStat[];
  evaluations: Evaluation[];
};
