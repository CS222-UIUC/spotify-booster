import React from 'react';
import './App.scss';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import GlobalStyles from '@mui/material/GlobalStyles';
import Callback from './components/login/Callback';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          body: { backgroundColor: theme.palette.background.default },
        }}
      ></GlobalStyles>
      <Header />
    </ThemeProvider>
  );
}
