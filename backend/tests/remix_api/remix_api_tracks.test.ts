// import { assert } from 'chai';
// import request from 'supertest';
// import path from 'path';
// import express, { Response, NextFunction } from 'express';
// import sinon from 'sinon';

// import createRemixRouter from '../../src/remix_api/remix_api';
// import Logger from '../../src/logger/logger';
// import * as spotifyAuth from '../../src/spotify_authentication/spotify_authentication';
// import arraysMatchUnordered from '../test_utils/assertions/arrays_match_unordered.test';
// import { matchTracks } from '../database_interface/database_interface_utils.test';

// const DB_LOCATION = path.join(__dirname, 'test.db');

// /**
//  * disableAuth() - disables spotify authentication by stubbing spotify authentication middleware
//  */
// async function disableAuth() {
//   sinon.stub(spotifyAuth, 'default').callsFake(() => {
//     return async function (req: spotifyAuth.AuthRequest, res: Response, next: NextFunction) {
//       req.spotify_uid = 'spotify_uid';
//       next();
//     };
//   });
// }

// /**
//  * createRemix() - sends post request to create a remix and returns its id
//  * @returns - remix_id and app
//  */
// async function createRemix() {
//   const log = new Logger('Test');
//   const router = createRemixRouter(log);
//   const app = express();
//   app.use(router);
//   const remix_name = 'text_remix';
//   const req0 = request(app);
//   const response = await req0.post(`/remixapi/createRemix?name=${remix_name}`);
//   return { remix_id: response.body.remix_id, app };
// }

// describe('Remix API Add Track', () => {
//   beforeEach(() => {
//     disableAuth();
//   });

//   it('adds track with valid remix_id', async () => {
//     const { remix_id, app } = await createRemix();

//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       const response1 = await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//       assert(response1.statusCode === 200, 'Responds with success status code');
//     }

//     const response2 = await request(app).get(`/remixapi/getRemixTracks?remix_id=${remix_id}`);

//     assert(response2.statusCode === 200, 'Responds with success status code');
//     arraysMatchUnordered(response2.body.tracks, tracks, matchTracks, 'Remix Tracks');
//   });

//   it('refuses to add track with invalid remix_id', async () => {
//     const { app } = await createRemix();

//     const remix_id = 'invalid';
//     const track_id = '6wmcrRId5aeo7hiEqHAtEO';
//     const response = await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${track_id}`);

//     assert(response.statusCode === 400, 'Responds with bad request code');
//     assert(response.body.error_message === 'Invalid Remix Id', 'Responds with error message');
//   });

//   it('refuses to add track with invalid track_id', async () => {
//     const { remix_id, app } = await createRemix();

//     const track_id = '';
//     const response = await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${track_id}`);

//     assert(response.statusCode === 400, 'Responds with bad request code');
//     assert(response.body.error_message === 'Invalid Track Id', 'Responds with error message');
//   });
// });

// describe('Remix API Delete Track', () => {
//   beforeEach(() => {
//     disableAuth();
//   });

//   it('deletes track with valid remix_id', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//     }

//     const response2 = await request(app).delete(`/remixapi/removeTrack?remix_id=${remix_id}&track_id=${tracks[0].track_id}`);
//     tracks.splice(0, 1);

//     assert(response2.statusCode === 200, 'Responds with success status code');

//     const response3 = await request(app).get(`/remixapi/getRemixTracks?remix_id=${remix_id}`);
//     arraysMatchUnordered(response3.body.tracks, tracks, matchTracks, 'Remix Tracks');
//   });

//   it('refuses to add track with invalid remix_id', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//     }

//     const invalid_remix_id = 'invalid';
//     const response2 = await request(app).delete(`/remixapi/removeTrack?remix_id=${invalid_remix_id}&track_id=${tracks[0]}`);

//     assert(response2.statusCode === 400, 'Responds with bad request code');
//     assert(response2.body.error_message === 'Invalid Remix Id', 'Responds with error message');

//     const response3 = await request(app).get(`/remixapi/getRemixTracks?remix_id=${remix_id}`);
//     arraysMatchUnordered(response3.body.tracks, tracks, matchTracks, 'Remix Tracks');
//   });

//   it('refuses to delete track with invalid track_id', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//     }

//     const invalid_track_id = 'invalid';
//     const response2 = await request(app).delete(`/remixapi/removeTrack?remix_id=${remix_id}&track_id=${invalid_track_id}`);

//     assert(response2.statusCode === 400, 'Responds with bad request code');
//     assert(response2.body.error_message === 'Invalid Track Id', 'Responds with error message');

//     const response3 = await request(app).get(`/remixapi/getRemixTracks?remix_id=${remix_id}`);
//     arraysMatchUnordered(response3.body.tracks, tracks, matchTracks, 'Remix Tracks');
//   });
// });

// describe('Remix API Get Tracks', () => {
//   beforeEach(() => {
//     disableAuth();
//   });

//   it('refuses to get tracks with invalid remix_id', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//     }

//     const invalid_remix_id = 'invalid';

//     const response = await request(app).get(`/remixapi/getRemixTracks?remix_id=${invalid_remix_id}`);
//     assert(response.statusCode === 400, 'Responds with bad request code');
//     assert(response.body.error_message === 'Invalid Remix Id', 'Responds with error message');
//   });
// });

// describe('Remix API Set Start/End Data', () => {
//   beforeEach(() => {
//     disableAuth();
//   });

//   it('sets start and end data correctly', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 10, end_ms: 0 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 20, end_ms: 20 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//       const response0 = await request(app).put(
//         `/remixapi/setStartMs?remix_id=${remix_id}&track_id=${tracks[i].track_id}&start_ms=${tracks[i].start_ms}`
//       );
//       const response1 = await request(app).put(
//         `/remixapi/setEndMs?remix_id=${remix_id}&track_id=${tracks[i].track_id}&end_ms=${tracks[i].end_ms}`
//       );

//       assert(response0.statusCode === 200, 'Responds with success request code');
//       assert(response1.statusCode === 200, 'Responds with success request code');
//     }

//     const response2 = await request(app).get(`/remixapi/getRemixTracks?remix_id=${remix_id}`);
//     arraysMatchUnordered(response2.body.tracks, tracks, matchTracks, 'Remix Tracks');
//   });

//   it('refuses to set invalid start data', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//     }

//     const invalid_remix_id = 'invalid';
//     const invalid_track_id = 'invalid;';
//     const track_id = tracks[0].track_id;
//     const response0 = await request(app).put(`/remixapi/setStartMs?remix_id=${remix_id}&track_id=${track_id}&start_ms=${-1}`);
//     const response1 = await request(app).put(
//       `/remixapi/setStartMs?remix_id=${remix_id}&track_id=${invalid_track_id}&start_ms=${0}`
//     );
//     const response2 = await request(app).put(
//       `/remixapi/setStartMs?remix_id=${invalid_remix_id}&track_id=${track_id}&start_ms=${0}`
//     );
//     const response3 = await request(app).put(
//       `/remixapi/setStartMs?remix_id=${invalid_remix_id}&track_id=${track_id}&start_ms=asdf`
//     );

//     assert(response0.statusCode === 400, 'Responds with bad request code');
//     assert(response0.body.error_message === 'start_ms cannot be negative', 'Responds with error message');
//     assert(response1.statusCode === 400, 'Responds with bad request code');
//     assert(response1.body.error_message === 'Invalid Track Id', 'Responds with error message');
//     assert(response2.statusCode === 400, 'Responds with bad request code');
//     assert(response2.body.error_message === 'Invalid Remix Id', 'Responds with error message');
//     assert(response3.statusCode === 400, 'Responds with bad request code');
//   });

//   it('refuses to set invalid end data', async () => {
//     const { remix_id, app } = await createRemix();
//     const tracks = [
//       { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
//       { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
//       { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
//     ];
//     for (let i = 0; i < tracks.length; i++) {
//       await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
//     }

//     const invalid_remix_id = 'invalid';
//     const invalid_track_id = 'invalid;';
//     const track_id = tracks[0].track_id;
//     const response0 = await request(app).put(`/remixapi/setEndMs?remix_id=${remix_id}&track_id=${track_id}&end_ms=${-2}`);
//     const response1 = await request(app).put(`/remixapi/setEndMs?remix_id=${remix_id}&track_id=${invalid_track_id}&end_ms=${-1}`);
//     const response2 = await request(app).put(`/remixapi/setEndMs?remix_id=${invalid_remix_id}&track_id=${track_id}&end_ms=${-1}`);
//     const response3 = await request(app).put(`/remixapi/setEndMs?remix_id=${invalid_remix_id}&track_id=${track_id}&end_ms=asdf`);

//     assert(response0.statusCode === 400, 'Responds with bad request code');
//     assert(response0.body.error_message === 'end_ms cannot be less than -1', 'Responds with error message');
//     assert(response1.statusCode === 400, 'Responds with bad request code');
//     assert(response1.body.error_message === 'Invalid Track Id', 'Responds with error message');
//     assert(response2.statusCode === 400, 'Responds with bad request code');
//     assert(response2.body.error_message === 'Invalid Remix Id', 'Responds with error message');
//     assert(response3.statusCode === 400, 'Responds with bad request code');
//   });
// });
