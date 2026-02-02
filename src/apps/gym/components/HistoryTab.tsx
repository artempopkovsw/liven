import DeleteIcon from '@mui/icons-material/Delete';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import type { Workout } from '../types';
import { formatWorkoutSet } from '../utils/metricsUtils';

interface HistoryTabProps {
  sortedWorkouts: Workout[];
  onDeleteWorkout: (workoutId: string) => void;
  onDeleteWorkoutSet: (workoutId: string, setId: string) => void;
}

export function HistoryTab({ sortedWorkouts, onDeleteWorkout, onDeleteWorkoutSet }: HistoryTabProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Workout History
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
    </Box>
  );
}
