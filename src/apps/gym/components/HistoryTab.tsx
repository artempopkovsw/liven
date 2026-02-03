import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { ExerciseOption, TemplateExercise, Workout } from '../types';
import { formatWorkoutSet } from '../utils/metricsUtils';
import { exerciseKey } from '../gymStore';

type TemplateDraft = {
  name: string;
  exercises: TemplateExercise[];
};

interface HistoryTabProps {
  sortedWorkouts: Workout[];
  onDeleteWorkout: (workoutId: string) => void;
  onDeleteWorkoutSet: (workoutId: string, setId: string) => void;
  exerciseOptions: string[];
  templates: Array<{ id: string; name: string; exercises: TemplateExercise[] }>;
  onCreateTemplate: (name: string, exercises: TemplateExercise[]) => void;
  onUpdateTemplate: (templateId: string, name: string, exercises: TemplateExercise[]) => void;
  onDeleteTemplate: (templateId: string) => void;
  onUseTemplate: (templateId: string) => void;
}

export function WorkoutsTab({
  sortedWorkouts,
  onDeleteWorkout,
  onDeleteWorkoutSet,
  exerciseOptions,
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
}: HistoryTabProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>({ name: '', exercises: [] });
  const [exerciseQuery, setExerciseQuery] = useState('');

  const parsedExercises = useMemo(() => {
    const raw = (draft.exercises || []).map((x) => String(x?.name || '').trim()).filter(Boolean);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const ex of raw) {
      const k = exerciseKey(ex);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(ex);
    }
    return out;
  }, [draft.exercises]);

  const canSave = draft.name.trim().length > 0 && parsedExercises.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const seen = new Set<string>();
    const exercises: TemplateExercise[] = [];
    for (const ex of draft.exercises || []) {
      const name = String(ex?.name || '').trim();
      if (!name) continue;
      const k = exerciseKey(name);
      if (seen.has(k)) continue;
      seen.add(k);
      exercises.push({
        name,
        reps: Math.max(1, Number(ex?.reps) || 0) || 8,
        sets: Math.max(1, Number(ex?.sets) || 0) || 3,
      });
    }

    if (editingId) {
      onUpdateTemplate(editingId, draft.name.trim(), exercises);
    } else {
      onCreateTemplate(draft.name.trim(), exercises);
    }
    setDraft({ name: '', exercises: [] });
    setExerciseQuery('');
    setEditingId(null);
    setOpen(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setDraft({ name: '', exercises: [] });
    setExerciseQuery('');
    setOpen(true);
  };

  const handleOpenEdit = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setEditingId(t.id);
    setDraft({
      name: t.name,
      exercises: (t.exercises || []).map((e) => ({
        name: String(e.name || '').trim(),
        reps: Math.max(1, Number(e.reps) || 0) || 8,
        sets: Math.max(1, Number(e.sets) || 0) || 3,
      })),
    });
    setExerciseQuery('');
    setOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Workouts</Typography>
          <Button startIcon={<AddIcon />} color="inherit" variant="outlined" onClick={handleOpenCreate} sx={{ borderRadius: 1 }}>
            New template
          </Button>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={800}>
                Templates
              </Typography>
              {templates.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Create a template (e.g. Push / Pull / Legs) to start logging faster.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {templates.map((t) => (
                    <Box
                      key={t.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        px: 1.25,
                        py: 1,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={800} noWrap>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t.exercises.length} {t.exercises.length === 1 ? 'exercise' : 'exercises'}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        color="inherit"
                        onClick={() => onUseTemplate(t.id)}
                        sx={{ borderRadius: 1, fontWeight: 800 }}
                      >
                        Use
                      </Button>
                      <IconButton size="small" color="inherit" onClick={() => handleOpenEdit(t.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => onDeleteTemplate(t.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="subtitle2" fontWeight={800}>
          History
        </Typography>

      {sortedWorkouts.map((w) => (
        <Accordion
          key={w.id}
          disableGutters
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '&:before': { display: 'none' },
            mb: 1,
          }}
        >
          <AccordionSummary sx={{ px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {w.name || 'Untitled'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {w.date} · {w.sets?.length || 0} {w.sets?.length === 1 ? 'set' : 'sets'}
                </Typography>
              </Box>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWorkout(w.id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2 }}>
            <List dense disablePadding>
              {(w.sets || []).map((s) => (
                <ListItem
                  key={s.id}
                  disableGutters
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={() => onDeleteWorkoutSet(w.id, s.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={s.exercise} secondary={formatWorkoutSet(s)} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

        <Dialog
          open={open}
          onClose={() => {
            setOpen(false);
            setEditingId(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{editingId ? 'Edit template' : 'Create template'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Template name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                fullWidth
              />
              <Autocomplete<ExerciseOption, true, false, true>
                multiple
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
                  const input = params.inputValue.trim();
                  const filtered = options.filter((o) =>
                    (typeof o === 'string' ? o : '').toLowerCase().includes(params.inputValue.toLowerCase())
                  );

                  const alreadyExists = input
                    ? filtered.some((f) => (typeof f === 'string' ? f : '').toLowerCase() === input.toLowerCase())
                    : false;

                  if (input && !alreadyExists) {
                    filtered.push({
                      inputValue: input,
                      title: `Add "${input}"`,
                    } as ExerciseOption);
                  }

                  return filtered;
                }}
                renderOption={(props, option) => {
                  let opt = '';
                  if (typeof option === 'string') opt = option;
                  else if (typeof option === 'object' && option !== null && 'title' in option) opt = option.title || '';
                  return <li {...props}>{opt}</li>;
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const label = typeof option === 'string' ? option : option.inputValue || option.title || '';
                    return <Chip {...getTagProps({ index })} key={`${label}-${index}`} label={label} size="small" />;
                  })
                }
                value={draft.exercises.map((x) => x.name) as ExerciseOption[]}
                onChange={(_, newValue) => {
                  const names = (newValue || [])
                    .map((v) => {
                      if (typeof v === 'string') return v;
                      if (typeof v === 'object' && v !== null && 'inputValue' in v) return v.inputValue || '';
                      return '';
                    })
                    .map((s) => s.trim())
                    .filter(Boolean);

                  const prev = draft.exercises || [];
                  const byKey = new Map<string, TemplateExercise>();
                  for (const ex of prev) byKey.set(exerciseKey(ex.name), ex);

                  const seen = new Set<string>();
                  const next: TemplateExercise[] = [];
                  for (const n of names) {
                    const k = exerciseKey(n);
                    if (seen.has(k)) continue;
                    seen.add(k);
                    const existing = byKey.get(k);
                    next.push(
                      existing || {
                        name: n,
                        reps: 8,
                        sets: 3,
                      }
                    );
                  }

                  setDraft((d) => ({ ...d, exercises: next }));
                }}
                inputValue={exerciseQuery}
                onInputChange={(_, v) => setExerciseQuery(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Exercises"
                    placeholder={draft.exercises.length ? 'Add another exercise' : 'Select or add'}
                    helperText={parsedExercises.length ? `${parsedExercises.length} exercises` : 'Add at least 1 exercise'}
                  />
                )}
              />

              {draft.exercises.length > 0 && (
                <Stack spacing={1}>
                  {draft.exercises.map((ex, idx) => (
                    <Box
                      key={`${exerciseKey(ex.name)}-${idx}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        px: 1.25,
                        py: 1,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800} noWrap>
                          {ex.name}
                        </Typography>
                      </Box>
                      <TextField
                        label="Reps"
                        type="number"
                        size="small"
                        value={String(ex.reps ?? 8)}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value) || 0) || 1;
                          setDraft((d) => ({
                            ...d,
                            exercises: d.exercises.map((x, i) => (i === idx ? { ...x, reps: v } : x)),
                          }));
                        }}
                        sx={{ width: 110 }}
                      />
                      <TextField
                        label="Sets"
                        type="number"
                        size="small"
                        value={String(ex.sets ?? 3)}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value) || 0) || 1;
                          setDraft((d) => ({
                            ...d,
                            exercises: d.exercises.map((x, i) => (i === idx ? { ...x, sets: v } : x)),
                          }));
                        }}
                        sx={{ width: 110 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="inherit" onClick={handleSave} disabled={!canSave} sx={{ borderRadius: 1, fontWeight: 800 }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}

// Back-compat export (older imports)
export const HistoryTab = WorkoutsTab;
