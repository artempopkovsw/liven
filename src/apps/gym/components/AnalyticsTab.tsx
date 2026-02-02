import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useMemo, useState } from 'react';
import type { GymEntry } from '../types';
import { computeAnalytics } from '../utils/analyticsUtils';
import { computeExerciseProgress, formatBestSet } from '../utils/exerciseProgressUtils';
import { computeOverview } from '../utils/overviewUtils';

interface AnalyticsTabProps {
  entries: GymEntry[];
  periodDays: number;
  onPeriodChange: (days: number) => void;
}

export function AnalyticsTab({ entries, periodDays, onPeriodChange }: AnalyticsTabProps) {
  const analytics = useMemo(() => computeAnalytics(entries, periodDays), [entries, periodDays]);
  const overview = useMemo(() => computeOverview(entries, periodDays), [entries, periodDays]);
  const [openExerciseKey, setOpenExerciseKey] = useState<string>('');

  const overviewSeriesForChart = useMemo(() => {
    return overview.series.filter((p) => (p.workouts || 0) > 0 || (p.liftedTons || 0) > 0);
  }, [overview.series]);

  const overviewByIso = useMemo(() => {
    const m = new Map<string, (typeof overview.series)[number]>();
    for (const p of overviewSeriesForChart) m.set(p.dateISO, p);
    return m;
  }, [overviewSeriesForChart, overview.series]);

  const openExercise = useMemo(() => {
    if (!openExerciseKey) return null;
    return analytics.list.find((x) => x.key === openExerciseKey) || null;
  }, [analytics.list, openExerciseKey]);

  const progress = useMemo(() => {
    if (!openExercise) return [];
    return computeExerciseProgress(entries, openExercise.exercise, periodDays);
  }, [entries, openExercise, periodDays]);

  const progressForChart = useMemo(() => {
    return progress.filter((p) => (p.sets || 0) > 0 || (p.volume || 0) > 0 || (p.bestWeightKg || 0) > 0);
  }, [progress]);

  const progressByIso = useMemo(() => {
    const m = new Map<string, (typeof progress)[number]>();
    for (const p of progressForChart) m.set(p.dateISO, p);
    return m;
  }, [progressForChart, progress]);

  const renderDelta = (val: number | null) => {
    if (val === null) return <TrendingFlatIcon fontSize="small" color="disabled" />;
    const rounded = Math.round(val);
    if (rounded === 0) return <TrendingFlatIcon fontSize="small" color="disabled" />;
    if (rounded > 0)
      return (
        <Chip icon={<TrendingUpIcon />} label={`+${rounded}%`} color="success" size="small" sx={{ fontWeight: 600 }} />
      );
    return (
      <Chip icon={<TrendingDownIcon />} label={`${rounded}%`} color="error" size="small" sx={{ fontWeight: 600 }} />
    );
  };

  const formatShortDate = (d: Date) => {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit' }).format(d);
  };

  const formatDeltaText = (abs: number, pctVal: number | null, unit?: string) => {
    if (pctVal === null) return null;
    const pctRounded = Math.round(pctVal);
    const absRounded = Math.round(abs);
    const absLabel = `${absRounded > 0 ? '+' : ''}${absRounded}${unit ? ` ${unit}` : ''}`;
    const pctLabel = `${pctRounded > 0 ? '+' : ''}${pctRounded}%`;
    return `${absLabel} / ${pctLabel}`;
  };

  const KpiRow = (props: {
    color: string;
    label: string;
    value: string;
    deltaText: string | null;
    positive: boolean | null;
  }) => (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
      <Box sx={{ width: 14, height: 14, borderRadius: 0.25, bgcolor: props.color, mt: 0.5 }} />
      <Box>
        <Typography variant="body2" color="text.secondary">
          {props.label}: <Typography component="span" color="text.primary" fontWeight={800}>{props.value}</Typography>
        </Typography>
        {props.deltaText && (
          <Typography
            variant="caption"
            sx={{
              color: props.positive === null ? 'text.secondary' : props.positive ? 'success.main' : 'error.main',
              fontWeight: 700,
            }}
          >
            ({props.deltaText})
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
          <Typography variant="h6">Overview</Typography>
          <Select value={periodDays} onChange={(e: any) => onPeriodChange(Number(e.target.value))} size="small">
            <MenuItem value={0}>All Time</MenuItem>
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={14}>Last 14 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
          </Select>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
          <CardContent>
            <Box sx={{ height: 260, mb: 2 }}>
              {overviewSeriesForChart.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No data for this period.
                  </Typography>
                </Box>
              ) : (
                <LineChart
                  dataset={overviewSeriesForChart}
                  xAxis={[
                    {
                      dataKey: 'dateISO',
                      scaleType: 'band',
                      valueFormatter: (iso: string | number) => {
                        const p = overviewByIso.get(String(iso));
                        return p ? formatShortDate(p.date) : '';
                      },
                    },
                  ]}
                  series={[
                    {
                      dataKey: 'cumulativeWorkouts',
                      label: 'Workouts',
                      color: '#55d6a2',
                      showMark: false,
                      curve: 'monotoneX',
                      valueFormatter: (v: unknown) => String(Math.round(Number(v) || 0)),
                    },
                    {
                      dataKey: 'cumulativeLiftedTons',
                      label: 'Lifted (ton)',
                      color: '#c77dff',
                      showMark: false,
                      curve: 'monotoneX',
                      valueFormatter: (v: unknown) => `${(Number(v) || 0).toFixed(1)} t`,
                    },
                  ]}
                  height={260}
                  margin={{ left: 0, right: 12, top: 8, bottom: 34 }}
                  sx={{
                    '& .MuiLineElement-root': { strokeWidth: 3 },
                    '& .MuiChartsAxis-directionY .MuiChartsAxis-tickLabel': { fontSize: 8 },
                  }}
                />
              )}
            </Box>

            <Stack spacing={1.25}>
              {KpiRow({
                color: '#55d6a2',
                label: 'Workouts',
                value: String(overview.current.workouts),
                deltaText: formatDeltaText(overview.delta.workouts.abs, overview.delta.workouts.pct),
                positive: overview.delta.workouts.pct === null ? null : overview.delta.workouts.abs >= 0,
              })}
              {KpiRow({
                color: '#c77dff',
                label: 'Lifted',
                value: `${(overview.current.liftedKg / 1000).toFixed(1)} ton`,
                deltaText:
                  overview.delta.liftedKg.pct === null
                    ? null
                    : `${(overview.delta.liftedKg.abs / 1000).toFixed(1)} ton / ${Math.round(overview.delta.liftedKg.pct)}%`,
                positive: overview.delta.liftedKg.pct === null ? null : overview.delta.liftedKg.abs >= 0,
              })}
              {KpiRow({
                color: '#69a7ff',
                label: 'Reps',
                value: String(overview.current.reps),
                deltaText: formatDeltaText(overview.delta.reps.abs, overview.delta.reps.pct),
                positive: overview.delta.reps.pct === null ? null : overview.delta.reps.abs >= 0,
              })}
              {KpiRow({
                color: '#ffa24c',
                label: 'Sets',
                value: String(overview.current.sets),
                deltaText: formatDeltaText(overview.delta.sets.abs, overview.delta.sets.pct),
                positive: overview.delta.sets.pct === null ? null : overview.delta.sets.abs >= 0,
              })}
              {KpiRow({
                color: '#ff6b6b',
                label: 'Heaviest',
                value: `${Math.round(overview.current.heaviestKg)} kg`,
                deltaText: formatDeltaText(overview.delta.heaviestKg.abs, overview.delta.heaviestKg.pct, 'kg'),
                positive: overview.delta.heaviestKg.pct === null ? null : overview.delta.heaviestKg.abs >= 0,
              })}
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="subtitle1" fontWeight="bold">
          By Exercise
        </Typography>

        {analytics.list.map((ex) => (
          <Card
            key={ex.key}
            variant="outlined"
            sx={{ cursor: 'pointer' }}
            onClick={() => setOpenExerciseKey(ex.key)}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">
                {ex.exercise}
              </Typography>

              <Stack spacing={1} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Sets
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {ex.sets}
                    </Typography>
                  </Box>
                  {renderDelta(ex.setsDeltaPct)}
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Volume
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {ex.totalVolume.toFixed(0)} kg
                    </Typography>
                  </Box>
                  {renderDelta(ex.deltaPct)}
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Best set
                    </Typography>
                    <Typography variant="body1">
                      {ex.bestSet ? `${ex.bestSet.reps} reps · ${ex.bestSet.weightKg ? `${ex.bestSet.weightKg} kg` : 'BW'}` : '—'}
                    </Typography>
                  </Box>
                </Stack>

                {ex.lastDate && (
                  <Typography variant="caption" color="text.secondary">
                    Last: {ex.lastDate.toLocaleDateString()}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}

        <Dialog
          open={Boolean(openExercise)}
          onClose={() => setOpenExerciseKey('')}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{openExercise?.exercise}</DialogTitle>
          <DialogContent dividers>
            {progress.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data for this period.
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Box sx={{ height: 260 }}>
                  <LineChart
                    dataset={progressForChart}
                    xAxis={[
                      {
                        dataKey: 'dateISO',
                        scaleType: 'band',
                        valueFormatter: (iso: string | number) => {
                          const p = progressByIso.get(String(iso));
                          return p ? formatShortDate(p.date) : '';
                        },
                      },
                    ]}
                    yAxis={[{}]}
                    series={[
                      {
                        dataKey: 'bestWeightKg',
                        showMark: false,
                        curve: 'monotoneX',
                        valueFormatter: (v: unknown) => `${Math.round(Number(v) || 0)} kg`,
                      },
                      {
                        dataKey: 'volume',
                        showMark: false,
                        curve: 'monotoneX',
                        valueFormatter: (v: unknown) => `${Math.round(Number(v) || 0)} kg`,
                      },
                    ]}
                    height={260}
                    margin={{ left: 0, right: 16, top: 8, bottom: 34 }}
                    sx={{
                      '& .MuiLineElement-root': { strokeWidth: 3 },
                      '& .MuiChartsAxis-directionY .MuiChartsAxis-tickLabel': { fontSize: 8 },
                    }}
                  />
                </Box>

                <Divider />

                <Typography variant="subtitle2" fontWeight="bold">
                  Workouts
                </Typography>
                <List dense disablePadding>
                  {progress
                    .slice()
                    .reverse()
                    .map((p) => (
                      <ListItem key={p.dateISO} disableGutters>
                        <ListItemText
                          primary={formatShortDate(p.date)}
                          secondary={`${p.sets} ${p.sets === 1 ? 'set' : 'sets'} · volume ${Math.round(
                            p.volume
                          )} kg · best ${formatBestSet(p.bestSet)}`}
                        />
                      </ListItem>
                    ))}
                </List>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setOpenExerciseKey('')}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}
