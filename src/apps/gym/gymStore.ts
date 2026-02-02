import { getJSON, setJSON } from '../../storage/kvStorage';

export interface GymEntry {
  id: string;
  date: string; // YYYY-MM-DD
  exercise: string;
  weightKg: number;
  reps: number;
  createdAt: number;
}

export interface WorkoutSet {
  id: string;
  exercise: string;
  weightKg: number;
  reps: number;
  createdAt: number;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  createdAt: number;
  sets: WorkoutSet[];
}

const ENTRIES_KEY = 'gym:entries:v1';
const WORKOUTS_KEY = 'gym:workouts:v1';
const EXERCISES_KEY = 'gym:exercises:v1';

export function exerciseKey(name: string): string {
  return (name || '').trim().toLowerCase();
}

function uniqueExercises(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const trimmed = (n || '').trim();
    if (!trimmed) continue;
    const key = exerciseKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function loadGymEntries(): Promise<GymEntry[]> {
  const data = await getJSON<GymEntry[]>(ENTRIES_KEY);
  return Array.isArray(data) ? data : [];
}

export async function saveGymEntries(entries: GymEntry[]): Promise<boolean> {
  return setJSON(ENTRIES_KEY, entries);
}

export async function loadWorkouts(): Promise<Workout[]> {
  const data = await getJSON<Workout[]>(WORKOUTS_KEY);
  return Array.isArray(data) ? data : [];
}

export async function saveWorkouts(workouts: Workout[]): Promise<boolean> {
  return setJSON(WORKOUTS_KEY, workouts);
}

export async function loadExercises(): Promise<string[]> {
  const data = await getJSON<string[]>(EXERCISES_KEY);
  return Array.isArray(data) ? uniqueExercises(data) : [];
}

export async function saveExercises(exercises: string[]): Promise<boolean> {
  return setJSON(EXERCISES_KEY, uniqueExercises(exercises));
}

export function createGymEntry(input: {
  date: string;
  exercise: string;
  weightKg: number;
  reps: number;
}): GymEntry {
  return {
    id: randomId(),
    date: input.date,
    exercise: (input.exercise || '').trim(),
    weightKg: Number.isFinite(input.weightKg) ? input.weightKg : 0,
    reps: Number.isFinite(input.reps) ? input.reps : 0,
    createdAt: Date.now(),
  };
}

export function createWorkout(input: { date: string; name?: string }): Workout {
  return {
    id: randomId(),
    date: input.date,
    name: (input.name || 'Workout').trim() || 'Workout',
    createdAt: Date.now(),
    sets: [],
  };
}

export function createWorkoutSet(input: {
  exercise: string;
  weightKg: number;
  reps: number;
}): WorkoutSet {
  return {
    id: randomId(),
    exercise: (input.exercise || '').trim(),
    weightKg: Number.isFinite(input.weightKg) ? input.weightKg : 0,
    reps: Number.isFinite(input.reps) ? input.reps : 0,
    createdAt: Date.now(),
  };
}

export function workoutLabel(w: Workout): string {
  const n = (w.name || 'Workout').trim() || 'Workout';
  return `${w.date} · ${n}`;
}

export function flattenWorkoutsToEntries(workouts: Workout[]): GymEntry[] {
  const out: GymEntry[] = [];
  for (const w of workouts) {
    for (const s of w.sets || []) {
      out.push({
        id: `${w.id}:${s.id}`,
        date: w.date,
        exercise: s.exercise,
        weightKg: s.weightKg,
        reps: s.reps,
        createdAt: s.createdAt,
      });
    }
  }
  return out;
}

export function migrateEntriesToWorkouts(entries: GymEntry[]): Workout[] {
  // Group by date, keep stable ordering by createdAt
  const byDate = new Map<string, GymEntry[]>();
  for (const e of entries) {
    const d = (e.date || '').trim();
    if (!d) continue;
    const list = byDate.get(d) || [];
    list.push(e);
    byDate.set(d, list);
  }

  const dates = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const workouts: Workout[] = [];

  for (const date of dates) {
    const list = byDate.get(date) || [];
    list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    const w: Workout = {
      id: randomId(),
      date,
      name: 'Workout',
      createdAt: list[0]?.createdAt ?? Date.now(),
      sets: list.map((e) => ({
        id: randomId(),
        exercise: (e.exercise || '').trim(),
        weightKg: Number(e.weightKg) || 0,
        reps: Number(e.reps) || 0,
        createdAt: e.createdAt ?? Date.now(),
      })),
    };
    workouts.push(w);
  }

  return workouts;
}
