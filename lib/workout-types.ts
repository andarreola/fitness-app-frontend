export type JsonRecord = Record<string, any>;

export type AdjustmentApplied =
  | "none"
  | "increase_weight"
  | "decrease_weight"
  | "progress_exercise"
  | "regress_exercise";

export type WorkoutSessionStatus = "in_progress" | "completed" | string;

export type WorkoutSetDetail = {
  id: string;
  workoutSessionExerciseId: string | null;
  sessionId: string | null;
  exerciseId: string | null;
  setNumber: number | null;
  targetReps: number | string | null;
  targetRpeMin: number | null;
  targetRpeMax: number | null;
  prescribedWeight: number | null;
  restSeconds: number | null;
  actualReps: number | null;
  actualWeight: number | null;
  actualRpe: number | null;
  notes: string | null;
};

export type WorkoutExerciseDetail = {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  exerciseName: string;
  exerciseSlotId: string;
  slotName: string;
  workoutContextId: string;
  variationLevelId: string | null;
  variationName: string;
  displayOrder: number;
  status: string | null;
  prescribedSets: number;
  prescribedReps: number | string | null;
  prescribedWeightLbs: number | null;
  prescribedRestSeconds: number | null;
  targetRpeMin: number | null;
  targetRpeMax: number | null;
  actualFinalRpe: number | null;
  adjustmentApplied: AdjustmentApplied | string | null;
  notes: string | null;
  isWeighted: boolean;
  sets: WorkoutSetDetail[];
};

export type WorkoutSessionDetail = {
  id: string;
  userId: string | null;
  workoutContextId: string | null;
  contextName: string;
  status: WorkoutSessionStatus | null;
  startedAt: string | null;
  completedAt: string | null;
  experienceLevelId: string | null;
  experienceLevelName: string | null;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
  legacySets: WorkoutSetDetail[];
};

export type WorkoutSessionSummary = {
  id: string;
  startedAt: string | null;
  completedAt: string | null;
  status: WorkoutSessionStatus | null;
  workoutContextId: string | null;
  contextName: string;
  experienceLevelName: string | null;
  plannedExerciseCount: number;
  isLegacy: boolean;
};

export type LogWorkoutSetInput = {
  setId: string;
  actualReps?: number | null;
  actualWeight?: number | null;
  actualRpe?: number | null;
  notes?: string | null;
};
