// Spotify API configuration
module.exports = {
  baseURL: 'https://api.spotify.com/v1/',
  clientId: '01e902e599d7467494c373c6873781ad',
  clientSec: '4990665be4f148d696cc5143ca4f84e4',
  authorizeUrlPrefix:
    'https://accounts.spotify.com/authorize?response_type=code',
  scopes:
    'user-read-email user-library-read user-read-playback-position user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-private streaming',
};
