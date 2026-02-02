import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { ExerciseOption, Workout } from '../types';

type WorkoutOption = Workout | string | { inputValue: string; title: string };

function workoutTitle(w: Workout): string {
  const name = (w.name || '').trim();
  return name || 'Untitled';
}

function workoutSetsLabel(w: Workout): string {
  const n = w.sets?.length || 0;
  return `${n} ${n === 1 ? 'set' : 'sets'}`;
}

interface LogTabProps {
  date: string;
  onDateChange: (date: string) => void;
  workoutsForDate: Workout[];
  selectedWorkout: Workout | null;
  onSelectWorkout: (workoutId: string) => void;
  onCreateWorkout: (name: string) => void;
  exerciseOptions: string[];
  onAddSets: (exercise: string, weightKg: number, reps: number, count: number) => void;
  onAddExercise: (exercise: string) => void;
  selectedWorkoutGroups: Array<{
    key: string;
    exercise: string;
    sets: Array<{ id: string; exercise: string; weightKg: number; reps: number; createdAt: number }>;
    totalVolume: number;
  }>;
  selectedWorkoutTotalVolume: number;
  onDeleteOneSet: (exerciseName: string, reps: number, weight: number) => void;
}

export function LogTab({
  date,
  onDateChange,
  workoutsForDate,
  selectedWorkout,
  onSelectWorkout,
  onCreateWorkout,
  exerciseOptions,
  onAddSets,
  onAddExercise,
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
                  type="date"
                  fullWidth
                  size="small"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />

                <Autocomplete<WorkoutOption, false, false, true>
                  freeSolo
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  options={workoutsForDate as WorkoutOption[]}
                  value={selectedWorkout as WorkoutOption | null}
                  inputValue={workoutQuery}
                  onInputChange={(_, v) => setWorkoutQuery(v)}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (typeof option === 'object' && option !== null) {
                      if ('id' in option) return workoutTitle(option);
                      if ('inputValue' in option && option.inputValue) return option.inputValue;
                      if ('title' in option && option.title) return option.title;
                    }
                    return '';
                  }}
                  filterOptions={(options, params) => {
                    const input = params.inputValue.trim();
                    const filtered = (options as WorkoutOption[]).filter((o) => {
                      if (typeof o === 'string') return o.toLowerCase().includes(input.toLowerCase());
                      if (typeof o === 'object' && o !== null && 'id' in o) {
                        return workoutTitle(o).toLowerCase().includes(input.toLowerCase());
                      }
                      return false;
                    });

                    const alreadyExists = (options as WorkoutOption[]).some((o) => {
                      if (typeof o === 'object' && o !== null && 'id' in o) {
                        return workoutTitle(o).trim().toLowerCase() === input.toLowerCase();
                      }
                      return false;
                    });

                    if (input && !alreadyExists) {
                      filtered.unshift({
                        inputValue: input,
                        title: `Create "${input}"`,
                      });
                    }

                    return filtered;
                  }}
                  renderOption={(props, option) => {
                    if (typeof option === 'string') return <li {...props}>{option}</li>;
                    if (typeof option === 'object' && option !== null) {
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
