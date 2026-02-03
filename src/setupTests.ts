import '@testing-library/jest-dom';

jest.mock('@mui/x-charts/LineChart', () => ({
	LineChart: () => null,
}));
