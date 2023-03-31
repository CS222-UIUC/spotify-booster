import cors from 'cors';

// Wrapper import for cors to avoid stubbing bug
export const CORS = cors({
  origin: 'http://localhost:3000',
  credentials: true,
});
