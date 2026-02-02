import { useMemo } from 'react';
import { Box, Card, CardActionArea, CardContent, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const apps = useMemo(
    () => [
      {
        key: 'gym',
        title: 'Athlio',
        description: 'Track workouts and see progress.',
        icon: <FitnessCenterIcon sx={{ fontSize: 44 }} />,
        onOpen: () => navigate('/gym'),
        enabled: true,
      },
      {
        key: 'coming-1',
        title: 'Coming soon',
        description: 'More mini-apps will appear here.',
        icon: <Box sx={{ fontSize: 44, lineHeight: 1 }}>…</Box>,
        onOpen: () => {},
        enabled: false,
      },
    ],
    [navigate]
  );

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Liven
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your personal collection of mini tools for real life.
      </Typography>

      <Grid container spacing={2}>
        {apps.map((app) => (
          <Grid size={{ xs: 12 }} key={app.key}>
            <Card variant="outlined" sx={{ height: '100%', minHeight: 124 }}>
              <CardActionArea
                onClick={app.enabled ? app.onOpen : undefined}
                disabled={!app.enabled}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.25, py: 2.75 }}>
                  <Box sx={{ color: 'primary.main', width: 64, display: 'flex', justifyContent: 'center' }}>
                    {app.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.15 }} noWrap>
                      {app.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                      {app.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
