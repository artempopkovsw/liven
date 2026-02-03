import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { ExerciseOption, TemplateExercise, Workout, WorkoutTemplate } from '../types';
import { exerciseKey } from '../gymStore';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';

type TemplateWorkoutOption = { kind: 'template'; id: string; name: string };
type WorkoutOption = Workout | string | { inputValue: string; title: string } | TemplateWorkoutOption;

function workoutTitle(w: Workout): string {
  const name = (w.name || '').trim();
  return name || 'Untitled';
}

function workoutSetsLabel(w: Workout): string {
  const n = w.sets?.length || 0;
  return `${n} ${n === 1 ? 'set' : 'sets'}`;
}

function isTemplateOption(o: WorkoutOption): o is TemplateWorkoutOption {
  return typeof o === 'object' && o !== null && 'kind' in o && (o as any).kind === 'template';
}

function WorkoutCalendarDay(
  props: PickersDayProps & {
    highlightedDates: Set<string>;
  }
) {
  const { day, outsideCurrentMonth, highlightedDates, ...other } = props;
  const iso = day.format('YYYY-MM-DD');
  const isHighlighted = !outsideCurrentMonth && highlightedDates.has(iso);
  return (
    <Badge
      overlap="circular"
      variant="dot"
      invisible={!isHighlighted}
      sx={{
        '& .MuiBadge-badge': {
          bgcolor: 'success.main',
          right: 6,
          top: 6,
        },
      }}
    >
      <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />
    </Badge>
  );
}

interface LogTabProps {
  date: string;
  onDateChange: (date: string) => void;
  workoutsForDate: Workout[];
  selectedWorkout: Workout | null;
  onSelectWorkout: (workoutId: string) => void;
  onCreateWorkout: (name: string) => void;
  templates: WorkoutTemplate[];
  onUseTemplate: (templateId: string) => void;
  exerciseOptions: string[];
  onAddSets: (exercise: string, weightKg: number, reps: number, count: number) => void;
  onAddExercise: (exercise: string) => void;
  templateExercises?: TemplateExercise[];
  allWorkouts: Workout[];
  selectedWorkoutGroups: Array<{
    key: string;
    exercise: string;
    sets: Array<{ id: string; exercise: string; weightKg: number; reps: number; createdAt: number }>;
    totalVolume: number;
  }>;
  selectedWorkoutTotalVolume: number;
  onDeleteOneSet: (exerciseName: string, reps: number, weight: number) => void;
}

type TemplateRowState = {
  weightKg: string;
  reps: string;
  setsCount: string;
};

export function LogTab({
  date,
  onDateChange,
  workoutsForDate,
  selectedWorkout,
  onSelectWorkout,
  onCreateWorkout,
  templates,
  onUseTemplate,
  exerciseOptions,
  onAddSets,
  onAddExercise,
  templateExercises,
  allWorkouts,
  selectedWorkoutGroups,
  selectedWorkoutTotalVolume,
  onDeleteOneSet,
}: LogTabProps) {
  const [exercise, setExercise] = useState<ExerciseOption>('');
  const [query, setQuery] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [reps, setReps] = useState('');
  const [setsCount, setSetsCount] = useState('1');
  const [workoutQuery, setWorkoutQuery] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const workoutDates = useMemo(() => {
    const set = new Set<string>();
    for (const w of allWorkouts || []) {
      const d = (w?.date || '').trim();
      if (d) set.add(d);
    }
    return set;
  }, [allWorkouts]);

  const activeExerciseName = useMemo(() => {
    const fromSelected =
      typeof exercise === 'string'
        ? exercise.trim()
        : typeof exercise === 'object' && exercise !== null
        ? (exercise.inputValue || '').trim()
        : '';
    return fromSelected || query.trim();
  }, [exercise, query]);

  const prevWeightForActiveExercise = useMemo(() => {
    if (!selectedWorkout) return undefined;
    const k = exerciseKey(activeExerciseName);
    if (!k) return undefined;

    const cutoffDate = selectedWorkout.date;
    const cutoffCreatedAt = Number(selectedWorkout.createdAt) || 0;

    for (const w of allWorkouts || []) {
      if (!w) continue;
      if (w.id === selectedWorkout.id) continue;
      if (cutoffDate && w.date && w.date > cutoffDate) continue;
      if (cutoffDate && w.date === cutoffDate && (Number(w.createdAt) || 0) >= cutoffCreatedAt) continue;

      let max = -Infinity;
      for (const s of w.sets || []) {
        if (exerciseKey(s.exercise) !== k) continue;
        const weight = Number(s.weightKg) || 0;
        if (weight > max) max = weight;
      }

      if (Number.isFinite(max)) return max;
    }

    return undefined;
  }, [activeExerciseName, allWorkouts, selectedWorkout]);

  const activeExerciseDelta = useMemo(() => {
    const prev = prevWeightForActiveExercise;
    const curr = Number(weightKg) || 0;
    if (!prev || prev <= 0 || curr <= 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    const pctRounded = Math.round(pct);
    const deltaKg = curr - prev;
    const color = pctRounded > 0 ? 'success.main' : pctRounded < 0 ? 'error.main' : 'text.secondary';
    return { prev, pctRounded, deltaKg, color };
  }, [prevWeightForActiveExercise, weightKg]);

  const prevVolumeForActiveExercise = useMemo(() => {
    if (!selectedWorkout) return undefined;
    const k = exerciseKey(activeExerciseName);
    if (!k) return undefined;

    const cutoffDate = selectedWorkout.date;
    const cutoffCreatedAt = Number(selectedWorkout.createdAt) || 0;

    for (const w of allWorkouts || []) {
      if (!w) continue;
      if (w.id === selectedWorkout.id) continue;
      if (cutoffDate && w.date && w.date > cutoffDate) continue;
      if (cutoffDate && w.date === cutoffDate && (Number(w.createdAt) || 0) >= cutoffCreatedAt) continue;

      let total = 0;
      let any = false;
      for (const s of w.sets || []) {
        if (exerciseKey(s.exercise) !== k) continue;
        const weight = Number(s.weightKg) || 0;
        const repsValue = Number(s.reps) || 0;
        total += weight * repsValue;
        any = true;
      }

      if (any) return total;
    }

    return undefined;
  }, [activeExerciseName, allWorkouts, selectedWorkout]);

  const activeExerciseVolumeDelta = useMemo(() => {
    const prev = prevVolumeForActiveExercise;
    const w = Number(weightKg) || 0;
    const r = Number(reps) || 0;
    const c = Math.max(1, Number(setsCount) || 1);
    const currVol = w > 0 && r > 0 ? w * r * c : 0;
    if (!prev || prev <= 0 || currVol <= 0) return null;
    const pct = ((currVol - prev) / prev) * 100;
    const pctRounded = Math.round(pct);
    const delta = currVol - prev;
    const color = pctRounded > 0 ? 'success.main' : pctRounded < 0 ? 'error.main' : 'text.secondary';
    return { prev, pctRounded, delta, color };
  }, [prevVolumeForActiveExercise, reps, setsCount, weightKg]);

  const templateKey = useMemo(() => {
    return JSON.stringify(
      (templateExercises || []).map((x) => [exerciseKey(x.name), Number(x.reps) || 0, Number(x.sets) || 0])
    );
  }, [templateExercises]);

  const [templateRows, setTemplateRows] = useState<Record<string, TemplateRowState>>({});

  useEffect(() => {
    const init: Record<string, TemplateRowState> = {};
    for (const ex of templateExercises || []) {
      const k = exerciseKey(ex.name);
      init[k] = {
        weightKg: '',
        reps: String(Math.max(1, Number(ex.reps) || 0) || ''),
        setsCount: String(Math.max(1, Number(ex.sets) || 0) || 1),
      };
    }
    setTemplateRows(init);
  }, [templateKey, templateExercises]);

  const getTemplateRow = (exerciseName: string): TemplateRowState => {
    const k = exerciseKey(exerciseName);
    return templateRows[k] || { weightKg: '', reps: '', setsCount: '1' };
  };

  const setTemplateRow = (exerciseName: string, patch: Partial<TemplateRowState>) => {
    const k = exerciseKey(exerciseName);
    setTemplateRows((prev) => ({
      ...prev,
      [k]: {
        ...(prev[k] || { weightKg: '', reps: '', setsCount: '1' }),
        ...patch,
      },
    }));
  };

  const handleAddTemplateExercise = (exerciseName: string) => {
    if (!selectedWorkout) return;
    const row = getTemplateRow(exerciseName);
    const w = Number(row.weightKg) || 0;
    const r = Number(row.reps) || 0;
    const c = Math.max(1, Number(row.setsCount) || 1);
    if (r <= 0) return;
    onAddSets(exerciseName, w, r, c);
  };

  const prevWeightByExerciseKey = useMemo(() => {
    const out = new Map<string, { maxWeight: number; totalVolume: number }>();
    if (!templateExercises || templateExercises.length === 0) return out;
    if (!selectedWorkout) return out;

    const needed = new Set<string>(templateExercises.map((x) => exerciseKey(x.name)));
    const cutoffDate = selectedWorkout.date;
    const cutoffCreatedAt = Number(selectedWorkout.createdAt) || 0;

    for (const w of allWorkouts || []) {
      if (!w) continue;
      if (selectedWorkout && w.id === selectedWorkout.id) continue;
      if (cutoffDate && w.date && w.date > cutoffDate) continue;
      if (cutoffDate && w.date === cutoffDate && (Number(w.createdAt) || 0) >= cutoffCreatedAt) continue;

      const perWorkout = new Map<string, { maxWeight: number; totalVolume: number }>();
      for (const s of w.sets || []) {
        const k = exerciseKey(s.exercise);
        if (!needed.has(k)) continue;
        const weight = Number(s.weightKg) || 0;
        const repsValue = Number(s.reps) || 0;
        const vol = weight * repsValue;
        const existing = perWorkout.get(k) || { maxWeight: -Infinity, totalVolume: 0 };
        existing.totalVolume += vol;
        if (weight > existing.maxWeight) existing.maxWeight = weight;
        perWorkout.set(k, existing);
      }

      for (const [k, stats] of perWorkout.entries()) {
        if (out.has(k)) continue;
        out.set(k, {
          maxWeight: Number.isFinite(stats.maxWeight) ? stats.maxWeight : 0,
          totalVolume: stats.totalVolume,
        });
      }

      if (out.size >= needed.size) break;
    }

    return out;
  }, [allWorkouts, selectedWorkout, templateExercises]);

  const handleAddSet = () => {
    const chosenExercise =
      typeof exercise === 'string'
        ? exercise.trim()
        : typeof exercise === 'object' && exercise !== null
        ? (exercise.inputValue || '').trim()
        : '';

    if (!chosenExercise) return;
    if (!selectedWorkout) return;

    const w = Number(weightKg) || 0;
    const r = Number(reps) || 0;
    const c = Math.max(1, Number(setsCount) || 1);

    onAddSets(chosenExercise, w, r, c);

    if (typeof exercise === 'object' && exercise !== null && 'inputValue' in exercise && exercise.inputValue) {
      onAddExercise(chosenExercise);
    }

    setExercise('');
    setWeightKg('');
    setReps('');
    setSetsCount('1');
    setQuery('');
  };

  return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 1 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Workout
                </Typography>

                <TextField
                  label="Date"
                  fullWidth
                  size="small"
                  value={date}
                  onClick={() => setCalendarOpen(true)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  inputProps={{ readOnly: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setCalendarOpen(true)}>
                          <CalendarMonthIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} fullWidth maxWidth="xs">
                  <DialogTitle>Select date</DialogTitle>
                  <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateCalendar
                        value={dayjs(date)}
                        onChange={(v) => {
                          if (!v) return;
                          onDateChange(v.format('YYYY-MM-DD'));
                          setCalendarOpen(false);
                        }}
                        slots={{
                          day: (dayProps) => <WorkoutCalendarDay {...dayProps} highlightedDates={workoutDates} />,
                        }}
                      />
                    </LocalizationProvider>
                  </DialogContent>
                </Dialog>

                <Autocomplete<WorkoutOption, false, false, true>
                  freeSolo
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  options={[...workoutsForDate, ...templates.map((t) => ({ kind: 'template', id: t.id, name: t.name }))] as WorkoutOption[]}
                  value={selectedWorkout as WorkoutOption | null}
                  inputValue={workoutQuery}
                  onInputChange={(_, v) => setWorkoutQuery(v)}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (typeof option === 'object' && option !== null) {
                      if (isTemplateOption(option)) return option.name;
                      if ('id' in option) return workoutTitle(option);
                      if ('inputValue' in option && option.inputValue) return option.inputValue;
                      if ('title' in option && option.title) return option.title;
                    }
                    return '';
                  }}
                  filterOptions={(options, params) => {
                    const input = params.inputValue.trim();
                    const opts = options as WorkoutOption[];

                    const filteredTemplates: WorkoutOption[] = [];
                    const filteredWorkouts: WorkoutOption[] = [];

                    for (const o of opts) {
                      if (typeof o === 'string') continue;
                      if (typeof o !== 'object' || o === null) continue;

                      if (isTemplateOption(o)) {
                        if (!input || o.name.toLowerCase().includes(input.toLowerCase())) {
                          filteredTemplates.push(o);
                        }
                        continue;
                      }

                      if ('id' in o) {
                        if (!input || workoutTitle(o).toLowerCase().includes(input.toLowerCase())) {
                          filteredWorkouts.push(o);
                        }
                      }
                    }

                    // Keep templates first, then create option, then date workouts.
                    const filtered: WorkoutOption[] = [...filteredTemplates, ...filteredWorkouts];

                    const alreadyExists = (options as WorkoutOption[]).some((o) => {
                      if (typeof o === 'object' && o !== null && 'id' in o && !isTemplateOption(o)) {
                        return workoutTitle(o as Workout).trim().toLowerCase() === input.toLowerCase();
                      }
                      return false;
                    });

                    if (input && !alreadyExists) {
                      filtered.splice(filteredTemplates.length, 0, {
                        inputValue: input,
                        title: `Create "${input}"`,
                      });
                    }

                    return filtered;
                  }}
                  renderOption={(props, option) => {
                    if (typeof option === 'string') return <li {...props}>{option}</li>;
                    if (typeof option === 'object' && option !== null) {
                      if (isTemplateOption(option)) {
                        return (
                          <li {...props}>
                            <Box sx={{ width: '100%' }}>
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Typography variant="body2" fontWeight={800}>
                                  {option.name}
                                </Typography>
                                <Chip size="small" label="Template" variant="outlined" sx={{ borderRadius: 1, fontWeight: 800 }} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Start workout from template
                              </Typography>
                            </Box>
                          </li>
                        );
                      }
                      if ('id' in option) {
                        return (
                          <li {...props}>
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="body2" fontWeight={650}>
                                {workoutTitle(option)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {workoutSetsLabel(option)}
                              </Typography>
                            </Box>
                          </li>
                        );
                      }
                      if ('title' in option) {
                        return (
                          <li {...props}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AddIcon fontSize="small" />
                              <Typography variant="body2" fontWeight={650}>
                                {option.title}
                              </Typography>
                            </Stack>
                          </li>
                        );
                      }
                    }
                    return <li {...props} />;
                  }}
                  onChange={(_, v) => {
                    if (!v) return;
                    if (typeof v === 'string') {
                      const name = v.trim();
                      if (name) onCreateWorkout(name);
                      return;
                    }
                    if (typeof v === 'object' && v !== null) {
                      if (isTemplateOption(v)) {
                        onUseTemplate(v.id);
                        return;
                      }
                      if ('id' in v) {
                        onSelectWorkout(v.id);
                        return;
                      }
                      if ('inputValue' in v) {
                        const name = (v.inputValue || '').trim();
                        if (name) onCreateWorkout(name);
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Workout"
                      placeholder={workoutsForDate.length ? 'Select or create' : 'Create your first workout'}
                      helperText={
                        selectedWorkout
                          ? `${workoutSetsLabel(selectedWorkout)} on ${selectedWorkout.date}`
                          : 'Type a name to create a workout'
                      }
                    />
                  )}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 1, opacity: selectedWorkout ? 1 : 0.6 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Add sets
                  </Typography>
                  {selectedWorkout && (
                    <Chip
                      size="small"
                      label={workoutSetsLabel(selectedWorkout)}
                      variant="outlined"
                      sx={{ fontWeight: 650, borderRadius: 1 }}
                    />
                  )}
                </Stack>

                <Autocomplete<ExerciseOption, false, false, true>
                  freeSolo
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  options={exerciseOptions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (typeof option === 'object' && option !== null) {
                      if ('inputValue' in option && option.inputValue) return option.inputValue;
                      if ('title' in option && option.title) return option.title;
                    }
                    return '';
                  }}
                  filterOptions={(options, params) => {
                    const filtered = options.filter((o) =>
                      (typeof o === 'string' ? o : '').toLowerCase().includes(params.inputValue.toLowerCase())
                    );
                    if (
                      params.inputValue.trim() &&
                      !filtered.some((f) =>
                        (typeof f === 'string' ? f : '').toLowerCase() === params.inputValue.toLowerCase()
                      )
                    ) {
                      filtered.push({
                        inputValue: params.inputValue,
                        title: `Add "${params.inputValue}"`,
                      } as ExerciseOption);
                    }
                    return filtered;
                  }}
                  renderOption={(props, option) => {
                    let opt = '';
                    if (typeof option === 'string') {
                      opt = option;
                    } else if (typeof option === 'object' && option !== null && 'title' in option) {
                      opt = option.title || '';
                    }
                    return <li {...props}>{opt}</li>;
                  }}
                  value={exercise}
                  onChange={(_, newValue) => setExercise(newValue || '')}
                  inputValue={query}
                  onInputChange={(_, newInputValue) => setQuery(newInputValue)}
                  renderInput={(params) => <TextField {...params} size="small" label="Exercise" />}
                  disabled={!selectedWorkout}
                />

                {selectedWorkout &&
                  activeExerciseName &&
                  (prevWeightForActiveExercise !== undefined ||
                    activeExerciseDelta !== null ||
                    prevVolumeForActiveExercise !== undefined ||
                    activeExerciseVolumeDelta !== null) && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {prevWeightForActiveExercise !== undefined && (
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        Prev: {prevWeightForActiveExercise} kg
                      </Box>
                    )}
                    {activeExerciseDelta !== null && (
                      <Box component="span" sx={{ color: activeExerciseDelta.color, fontWeight: 800 }}>
                        {' '}
                        · {activeExerciseDelta.pctRounded >= 0 ? '+' : ''}
                        {activeExerciseDelta.pctRounded}% ({activeExerciseDelta.deltaKg >= 0 ? '+' : ''}
                        {Math.round(activeExerciseDelta.deltaKg)} kg)
                      </Box>
                    )}

                    {prevVolumeForActiveExercise !== undefined && (
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {' '}
                        · Vol prev: {Math.round(prevVolumeForActiveExercise)}
                      </Box>
                    )}
                    {activeExerciseVolumeDelta !== null && (
                      <Box component="span" sx={{ color: activeExerciseVolumeDelta.color, fontWeight: 800 }}>
                        {' '}
                        · Vol {activeExerciseVolumeDelta.pctRounded >= 0 ? '+' : ''}
                        {activeExerciseVolumeDelta.pctRounded}% ({activeExerciseVolumeDelta.delta >= 0 ? '+' : ''}
                        {Math.round(activeExerciseVolumeDelta.delta)})
                      </Box>
                    )}
                  </Typography>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    label="Weight (kg)"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={!selectedWorkout}
                  />
                  <TextField
                    label="Reps"
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={!selectedWorkout}
                  />
                  <TextField
                    label="Sets"
                    type="number"
                    value={setsCount}
                    onChange={(e) => setSetsCount(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={!selectedWorkout}
                  />
                </Stack>

                <Button
                  color="inherit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSet}
                  fullWidth
                  disabled={!selectedWorkout}
                  sx={{ borderRadius: 1 }}
                >
                  Add
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {selectedWorkout && templateExercises && templateExercises.length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 1 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={800}>
                      Template exercises
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {templateExercises.length} {templateExercises.length === 1 ? 'exercise' : 'exercises'}
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    {templateExercises.map((ex) => {
                      const row = getTemplateRow(ex.name);
                      const canAdd = (Number(row.reps) || 0) > 0 && (Number(row.setsCount) || 0) > 0;
                      const prevStats = prevWeightByExerciseKey.get(exerciseKey(ex.name));
                      const currWeight = Number(row.weightKg) || 0;
                      const prevWeight = prevStats?.maxWeight;
                      const pct = prevWeight && prevWeight > 0 && currWeight > 0 ? ((currWeight - prevWeight) / prevWeight) * 100 : null;
                      const deltaKg = prevWeight && prevWeight > 0 && currWeight > 0 ? currWeight - prevWeight : null;
                      const pctRounded = pct === null ? null : Math.round(pct);

                      const currReps = Number(row.reps) || 0;
                      const currSets = Math.max(1, Number(row.setsCount) || 1);
                      const currVol = currWeight > 0 && currReps > 0 ? currWeight * currReps * currSets : 0;
                      const prevVol = prevStats?.totalVolume;
                      const volPct = prevVol && prevVol > 0 && currVol > 0 ? ((currVol - prevVol) / prevVol) * 100 : null;
                      const volDelta = prevVol && prevVol > 0 && currVol > 0 ? currVol - prevVol : null;
                      const volPctRounded = volPct === null ? null : Math.round(volPct);
                      const deltaColor =
                        pctRounded === null
                          ? 'text.secondary'
                          : pctRounded > 0
                          ? 'success.main'
                          : pctRounded < 0
                          ? 'error.main'
                          : 'text.secondary';

                      const volColor =
                        volPctRounded === null
                          ? 'text.secondary'
                          : volPctRounded > 0
                          ? 'success.main'
                          : volPctRounded < 0
                          ? 'error.main'
                          : 'text.secondary';

                      return (
                        <Box
                          key={ex.name}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            px: 1.25,
                            py: 1,
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={800} noWrap>
                                  {ex.name}
                                </Typography>
                                {(prevWeight !== undefined || pctRounded !== null || prevVol !== undefined || volPctRounded !== null) && (
                                  <Typography variant="caption" sx={{ display: 'block' }}>
                                    {prevWeight !== undefined && (
                                      <Box component="span" sx={{ color: 'text.secondary' }}>
                                        Prev: {prevWeight} kg
                                      </Box>
                                    )}
                                    {pctRounded !== null && deltaKg !== null && (
                                      <Box component="span" sx={{ color: deltaColor, fontWeight: 800 }}>
                                        {' '}
                                        · {pctRounded >= 0 ? '+' : ''}{pctRounded}% ({deltaKg >= 0 ? '+' : ''}{Math.round(deltaKg)} kg)
                                      </Box>
                                    )}

                                    {prevVol !== undefined && (
                                      <Box component="span" sx={{ color: 'text.secondary' }}>
                                        {' '}
                                        · Vol prev: {Math.round(prevVol)}
                                      </Box>
                                    )}
                                    {volPctRounded !== null && volDelta !== null && (
                                      <Box component="span" sx={{ color: volColor, fontWeight: 800 }}>
                                        {' '}
                                        · Vol {volPctRounded >= 0 ? '+' : ''}{volPctRounded}% ({volDelta >= 0 ? '+' : ''}{Math.round(volDelta)})
                                      </Box>
                                    )}
                                  </Typography>
                                )}
                              </Box>
                              <Button
                                size="small"
                                variant="contained"
                                color="inherit"
                                onClick={() => handleAddTemplateExercise(ex.name)}
                                disabled={!canAdd}
                                sx={{ borderRadius: 1, fontWeight: 800 }}
                              >
                                Add
                              </Button>
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                              <TextField
                                label="Weight (kg)"
                                type="number"
                                value={row.weightKg}
                                onChange={(e) => setTemplateRow(ex.name, { weightKg: e.target.value })}
                                fullWidth
                                size="small"
                              />
                              <TextField
                                label="Reps"
                                type="number"
                                value={row.reps}
                                onChange={(e) => setTemplateRow(ex.name, { reps: e.target.value })}
                                fullWidth
                                size="small"
                              />
                              <TextField
                                label="Sets"
                                type="number"
                                value={row.setsCount}
                                onChange={(e) => setTemplateRow(ex.name, { setsCount: e.target.value })}
                                fullWidth
                                size="small"
                              />
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          {selectedWorkout && (
            <Card variant="outlined" sx={{ borderRadius: 1 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="baseline" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {workoutTitle(selectedWorkout)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedWorkout.date}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" variant="outlined" label={workoutSetsLabel(selectedWorkout)} sx={{ borderRadius: 1 }} />
                      <Chip size="small" variant="outlined" label={`${Math.round(selectedWorkoutTotalVolume)} kg`} sx={{ borderRadius: 1 }} />
                    </Stack>
                  </Stack>

                  {selectedWorkoutGroups.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No sets yet. Add your first set above.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {selectedWorkoutGroups.map((group, idx) => {
                        const counts = new Map<string, { count: number; vol: number }>();
                        for (const s of group.sets) {
                          const key = `${s.reps}×${s.weightKg}`;
                          const existing = counts.get(key) || { count: 0, vol: 0 };
                          existing.count += 1;
                          existing.vol += s.weightKg * s.reps;
                          counts.set(key, existing);
                        }

                        const rows = Array.from(counts.entries()).map(([key, { count, vol }]) => {
                          const [repsStr, weightStr] = key.split('×');
                          return {
                            key,
                            label: `${count} × ${repsStr} reps · ${weightStr} kg`,
                            vol,
                            reps: Number(repsStr),
                            weight: Number(weightStr),
                          };
                        });

                        rows.sort((a, b) => b.vol - a.vol);

                        return (
                          <Box key={group.key}>
                            {idx > 0 && <Divider sx={{ mb: 1.5 }} />}
                            <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                              <Typography variant="subtitle2" fontWeight={750}>
                                {group.exercise}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'} · {Math.round(
                                  group.totalVolume
                                )} kg
                              </Typography>
                            </Stack>
                            <Box sx={{ mt: 1 }}>
                              {rows.map((row) => (
                                <Stack key={row.key} direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2" sx={{ flex: 1 }}>
                                    {row.label}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDeleteOneSet(group.exercise, row.reps, row.weight)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
  );
}
