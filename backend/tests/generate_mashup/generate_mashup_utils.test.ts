import { TrackInfo } from '../../src/database_interface/track_db_interface';
import { SectionProps } from '../../src/generate_mashup/get_track_sections';

// Compares two section properties objects
export function compareSectionProps(a: SectionProps, e: SectionProps) {
  return (
    a.start_ms === e.start_ms &&
    a.end_ms === e.end_ms &&
    a.loudness === e.loudness &&
    a.tempo === e.tempo &&
    a.key === e.key &&
    a.mode === e.mode &&
    a.time_signature === e.time_signature
  );
}

// Compares two arrays of arrays of track sections
export function compareAllTrackSections(a: Array<SectionProps>, e: Array<SectionProps>) {
  if (a.length !== e.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!compareSectionProps(a[i], e[i])) {
      return false;
    }
  }
  return true;
}

// Checks that a given track info matches a section and track in given section properties and track ids,
export function trackInfoSectionExists(tracks: Array<string>, sections: Array<Array<SectionProps>>, b: TrackInfo) {
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i] === b.track_id) {
      for (const section of sections[i]) {
        if (section.start_ms === b.start_ms && section.end_ms === b.end_ms) return true;
      }
    }
  }
  return false;
}
