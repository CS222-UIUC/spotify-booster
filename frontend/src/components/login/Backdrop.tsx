import React from 'react';
// import { useState, useEffect } from 'react';

const LogoutBackdrop: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <div
      style={{
        display: isOpen ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <h1 style={{ color: '#fff' }}>You have been logged out.</h1>
      </div>
    </div>
  );
};