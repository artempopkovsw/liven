import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EditNoteIcon from '@mui/icons-material/EditNote';
import HistoryIcon from '@mui/icons-material/History';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsTab } from './components/AnalyticsTab';
import { HistoryTab } from './components/HistoryTab';
import { LogTab } from './components/LogTab';
import { useGymData } from './hooks/useGymData';
import { todayISO } from './utils/dateUtils';

export function GymHelperApp() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [periodDays, setPeriodDays] = useState(30);

  const {
    loading,
    sortedWorkouts,
    selectedWorkout,
    selectedWorkoutId,
    setSelectedWorkoutId,
    exerciseOptions,
    selectedWorkoutGroups,
    selectedWorkoutTotalVolume,
    entries,
    addWorkout,
    addSets,
    deleteWorkout,
    deleteWorkoutSet,
    deleteOneWorkoutSetBySignature,
    addExercise,
  } = useGymData();

  const workoutsForSelectedDate = useMemo(() => {
    return sortedWorkouts.filter((w) => w.date === date);
  }, [sortedWorkouts, date]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (selectedWorkout && selectedWorkout.date !== newDate) {
      setSelectedWorkoutId('');
    }
  };

  const handleCreateWorkout = async (name: string) => {
    const workout = await addWorkout(date, name);
    setSelectedWorkoutId(workout.id);
  };

  const handleAddSets = async (exercise: string, weightKg: number, reps: number, count: number) => {
    if (!selectedWorkoutId) return;
    await addSets(selectedWorkoutId, exercise, weightKg, reps, count);
  };

  const handleDeleteOneSet = async (exerciseName: string, reps: number, weight: number) => {
    if (!selectedWorkoutId) return;
    await deleteOneWorkoutSetBySignature(selectedWorkoutId, exerciseName, reps, weight);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" disableGutters>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Athlio
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ pb: 10 }}>
        {tab === 0 && (
          <LogTab
            date={date}
            onDateChange={handleDateChange}
            workoutsForDate={workoutsForSelectedDate}
            selectedWorkout={selectedWorkout}
            onSelectWorkout={setSelectedWorkoutId}
            onCreateWorkout={handleCreateWorkout}
            exerciseOptions={exerciseOptions}
            onAddSets={handleAddSets}
            onAddExercise={addExercise}
            selectedWorkoutGroups={selectedWorkoutGroups}
            selectedWorkoutTotalVolume={selectedWorkoutTotalVolume}
            onDeleteOneSet={handleDeleteOneSet}
          />
        )}

        {tab === 1 && (
          <HistoryTab
            sortedWorkouts={sortedWorkouts}
            onDeleteWorkout={deleteWorkout}
            onDeleteWorkoutSet={deleteWorkoutSet}
          />
        )}

        {tab === 2 && <AnalyticsTab entries={entries} periodDays={periodDays} onPeriodChange={setPeriodDays} />}
      </Box>

      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ maxWidth: (theme) => theme.breakpoints.values.sm, mx: 'auto' }}>
          <BottomNavigation
            showLabels={false}
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ bgcolor: '#fff', height: 76 }}
          >
            <BottomNavigationAction
              label="Log"
              icon={<EditNoteIcon sx={{ fontSize: 34 }} />}
              showLabel={tab === 0}
              sx={{
                minWidth: 0,
                px: 2,
                py: 1.25,
                transition: 'transform 160ms ease',
                '& .MuiBottomNavigationAction-label': {
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  opacity: 0,
                  transform: 'translateY(-4px)',
                  fontSize: 12,
                  fontWeight: 700,
                },
                '&.Mui-selected': {
                  transform: 'translateY(-4px)',
                },
                '&.Mui-selected .MuiBottomNavigationAction-label': {
                  opacity: 1,
                  transform: 'translateY(0px)',
                },
              }}
            />
            <BottomNavigationAction
              label="History"
              icon={<HistoryIcon sx={{ fontSize: 34 }} />}
              showLabel={tab === 1}
              sx={{
                minWidth: 0,
                px: 2,
                py: 1.25,
                transition: 'transform 160ms ease',
                '& .MuiBottomNavigationAction-label': {
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  opacity: 0,
                  transform: 'translateY(-4px)',
                  fontSize: 12,
                  fontWeight: 700,
                },
                '&.Mui-selected': {
                  transform: 'translateY(-4px)',
                },
                '&.Mui-selected .MuiBottomNavigationAction-label': {
                  opacity: 1,
                  transform: 'translateY(0px)',
                },
              }}
            />
            <BottomNavigationAction
              label="Overview"
              icon={<AnalyticsIcon sx={{ fontSize: 34 }} />}
              showLabel={tab === 2}
              sx={{
                minWidth: 0,
                px: 2,
                py: 1.25,
                transition: 'transform 160ms ease',
                '& .MuiBottomNavigationAction-label': {
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  opacity: 0,
                  transform: 'translateY(-4px)',
                  fontSize: 12,
                  fontWeight: 700,
                },
                '&.Mui-selected': {
                  transform: 'translateY(-4px)',
                },
                '&.Mui-selected .MuiBottomNavigationAction-label': {
                  opacity: 1,
                  transform: 'translateY(0px)',
                },
              }}
            />
          </BottomNavigation>
        </Box>
      </Paper>
    </Container>
  );
}
