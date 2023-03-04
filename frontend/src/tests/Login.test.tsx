import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Router, Route } from 'react-router-dom';

// Components to be tested
import { setCookie, getCookie } from '../components/login/Cookie';

/*
    TODO:
      1. Check if `Logout` button exists after logged in
      2. Check if user's `diaplay_name` has successfully rendered
      3. Check if `Login with Spotify` button could redirect to the correct path
*/
describe('setCookie', () => {
  it("successfully set the cookie '0123456789'", () => {
    // Define the mock onClick function
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: 'myCookie=omnomnom',
    });

    const cookieName = 'spotify_access_token';
    const cookieValue = '0123456789';
    const expireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    setCookie(cookieName, cookieValue, 7);

    const expectedCookieValue = `${cookieName}=${cookieValue}; expires=${expireDate.toUTCString()}; path=/; SameSite=Lax`;
    // Check if the cookie get is '0123456789'
    expect(document.cookie).toEqual(expectedCookieValue);
  });
});

describe('getCookie', () => {
  it("successfully get the cookie '0123456789'", () => {
    // Define the mock onClick function
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: 'spotify_access_token=0123456789',
    });

    // Check if the cookie get is '0123456789'
    expect(document.cookie).toEqual(
      'spotify_access_token=' + getCookie('spotify_access_token')
    );
  });
});
