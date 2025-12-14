export interface Player {
  id: number;
  name: string;
  color: string;
  totalScore: number;
}

export interface QuizPhoto {
  id: string;
  image: string;
  text: string;
  answer?: string;
  lat: number;
  lng: number;
}

export interface Guess {
  playerId: number;
  playerName: string;
  playerColor: string;
  coordinates: [number, number];
  distance: number;
  points: number;
}

export type Screen = 'password' | 'setup' | 'quiz' | 'results' | 'final';

export type Theme = 'default' | 'christmas';

export const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#82E0AA', // Green
  '#F8B500', // Orange
  '#E056FD', // Pink
];

export const QUIZ_PASSWORDS: Record<string, string> = {
  'e5a32e4aa10c11407bb87b67b2bdcc4f563e30b8f44c68f1547428f007292732': 'bashchristmas',
  'b2e59516753c04c4d910791c73d581143765e4db182a5441d6af3f523f0f282a': 'kerst2025',
};

export const MAPBOX_TOKEN = 'pk.eyJ1IjoibWF4bWlqbiIsImEiOiJjbWoxa2pmYnUwanQyM2VzYjFjOHl6cW5xIn0.LS3snE9DmmIjNE46Nv-oMQ';
