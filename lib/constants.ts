export const COLORS = {
  primary: '#000000',
  secondary: '#fdcff3',
  background: '#0b0930',
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
  },
  success: '#4CAF50',
  error: '#FF4444',
  warning: '#FF6B35',
};

export const DEPOSIT_AMOUNTS = [10, 25, 50, 100];

export const MIN_STAKE = 0.5;
export const MAX_STAKE = 100;
export const MAX_PLAYERS = 8;

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_LABELS = ['M', 'T', 'W', 'TH', 'F', 'S', 'S'] as const;

export const WORKOUT_TYPES = [
  'Push',
  'Pull',
  'Legs',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Cardio',
  'Rest',
] as const;


