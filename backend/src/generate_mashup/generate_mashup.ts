import DatabaseInterface from '../database_interface/database_interface';
import { TrackInfo } from '../database_interface/track_db_interface';
import Logger from '../logger/logger';
import { awaitAllPromises } from '../utils';
import findOptimalMashup from './find_optimal_mashup';
import getSourceTracks from './get_source_tracks';
import getTrackSections, { SectionProps } from './get_track_sections';
import saveToDb from './save_to_db';

const BATCH_REQUEST_AMOUNT = 10; // number of spotify_api requests to send at one moment to get track sections
const BATCH_REQUEST_INTERVAL_MS = 100; // number of milliseconds to wait before sending another batch of requests

export enum SourceType {
  Album = 0,
  Playlist = 1,
}

// Wraps getSourceTracks for logging and error handling
async function getTracks(source_id: string, source_type: SourceType, access_token: string, log: Logger) {
  const profile = log.profile('Get Source Tracks', { warn: 1000, error: 5000 });

  let tracks;
  try {
    tracks = await getSourceTracks(source_id, source_type, access_token);

    profile.stop();
  } catch (error) {
    log.error(`Failed to get source tracks for source_id: ${source_id} and source_type: ${source_type}`, error);
    profile.stop({ success: false, level: 'error' });

    throw new Error('Failed To Get Tracks From Source');
  }

  return tracks;
}

// Check that start track is in source, throws error if not
function assertStartInSource(start_track_id: string, tracks: Array<string>) {
  let found = false;
  for (const track_id of tracks) {
    if (track_id === start_track_id) {
      found = true;
      break;
    }
  }
  if (!found) throw new Error('Start Track Not In Source');
}

// Wraps getTrackSections for batch requests, logging, and error handling
async function getAllSections(source_id: string, tracks: Array<string>, access_token: string, log: Logger) {
  const profile = log.profile('Get All Track Sections', { warn: 10000, error: 30000 });

  let track_sections: Array<Array<SectionProps>> = [];
  try {
    for (let i = 0; i < tracks.length; i += BATCH_REQUEST_AMOUNT) {
      const await_track_sections = [];
      for (let j = i; j < tracks.length && j < i + BATCH_REQUEST_AMOUNT; j++) {
        await_track_sections.push(getTrackSections(tracks[j], access_token));
      }

      track_sections = [...track_sections, ...(await awaitAllPromises(await_track_sections))];

      await new Promise((resolve) => {
        setTimeout(resolve, BATCH_REQUEST_INTERVAL_MS);
      });
    }

    profile.stop();
  } catch (error) {
    log.error(`Failed to get track sections for source_id: ${source_id}`, error);
    profile.stop({ success: false, level: 'error' });

    throw new Error('Failed To Get Track Sections');
  }

  return track_sections;
}

// Wraps findOptimalMashup function for logging and error handling
async function findOptimal(
  source_id: string,
  start_track_id: string,
  tracks: Array<string>,
  sections: Array<Array<SectionProps>>,
  log: Logger
) {
  const profile = log.profile('Find Optimal Mashup', { warn: 10000, error: 3000 });

  let optimal: Array<TrackInfo>;
  try {
    optimal = await findOptimalMashup(start_track_id, tracks, sections);

    profile.stop();
  } catch (error) {
    log.error(`Failed while optimizing mashup for source_id: ${source_id}`, error);
    profile.stop({ success: false, level: 'error' });

    throw new Error('Failed To Generate Mashup');
  }

  return optimal;
}

// Wraps saveToDb function for logging and error handling
async function save(source_id: string, db: DatabaseInterface, mashup_id: string, tracks: Array<TrackInfo>, log: Logger) {
  const profile = log.profile('Save Generated Mashup to Database', { warn: 5000, error: 10000 });

  try {
    await saveToDb(db, mashup_id, tracks);

    profile.stop();
  } catch (error) {
    log.error(`Failed while saving generated mashup for source_id: ${source_id}`, error);
    profile.stop({ success: false, level: 'error' });

    throw new Error('Failed To Save Mashup: ' + error.message);
  }
}

/**
 * GenerateMashup() - Generates a mashup and saves it to the database at given mashup_id
 * @param mashup_id - mashup_id of mashup to save to
 * @param start_track_id - spotify track_id of track to start with
 * @param source_id - spotify id of album or playlist to use as a source
 * @param source_type - type of spotify source
 * @param access_token - spotify api access token
 * @returns Promise that resolves once mashup has been created successsfully
 */
export default async function GenerateMashup(
  mashup_id: string,
  start_track_id: string,
  source_id: string,
  source_type: SourceType,
  access_token: string,
  db: DatabaseInterface,
  log: Logger
): Promise<void> {
  const tracks = await getTracks(source_id, source_type, access_token, log);

  assertStartInSource(start_track_id, tracks);

  const sections = await getAllSections(source_id, tracks, access_token, log);

  const optimal = await findOptimal(source_id, start_track_id, tracks, sections, log);

  await save(source_id, db, mashup_id, optimal, log);
}
