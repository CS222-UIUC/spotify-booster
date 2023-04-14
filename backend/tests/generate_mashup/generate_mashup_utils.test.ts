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
