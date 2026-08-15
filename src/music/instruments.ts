export type InstrumentFamily =
  | "Touch Guitar"
  | "Chapman Stick"
  | "Other";

export type InstrumentStringGroup = {
  id: string;
  name: string;
  stringNumbers: readonly number[];
  /**
   * Describes how the physical gauges run across this group.
   * This is display/geometry metadata; it does not change pitch logic.
   */
  gaugeDirection: "thick-to-thin" | "thin-to-thick";
};

export type InstrumentTuningPreset = {
  id: string;
  name: string;
  tuning: readonly string[];
};

export type InstrumentGeometry = {
  frets: number;
  /**
   * Physical fret positions that should not behave as normal playable frets.
   * Empty for the U8 Deluxe.
   */
  nonPlayableFrets?: readonly number[];
  /**
   * Optional string groups for instruments whose string layout has
   * meaningful physical sections, such as a Chapman Stick.
   */
  stringGroups?: readonly InstrumentStringGroup[];
};

export type TappingInstrumentPreset = {
  id: string;
  name: string;
  family: InstrumentFamily;
  description: string;

  /**
   * Backward-compatible default tuning.
   * Existing app code can continue reading instrument.tuning unchanged.
   */
  tuning: readonly string[];

  /**
   * Named tuning presets. This lets future instruments expose several
   * tunings without treating each tuning as a separate instrument.
   */
  tuningPresets: readonly InstrumentTuningPreset[];
  defaultTuningPresetId: string;

  /**
   * Backward-compatible fret count used by the current fretboard.
   */
  frets: number;

  /**
   * Instrument-specific physical/display metadata.
   */
  geometry: InstrumentGeometry;
};

const U8_DELUXE_STANDARD_TUNING = [
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "C",
  "D",
] as const;

export const TOUCH_GUITAR_U8: TappingInstrumentPreset = {
  id: "touch-guitar-u8",
  name: "U8 Deluxe",
  family: "Touch Guitar",
  description: "Markus Reuter U8 Deluxe",

  tuning: U8_DELUXE_STANDARD_TUNING,

  tuningPresets: [
    {
      id: "standard",
      name: "Standard",
      tuning: U8_DELUXE_STANDARD_TUNING,
    },
  ],
  defaultTuningPresetId: "standard",

  frets: 24,

  geometry: {
    frets: 24,
    nonPlayableFrets: [],
    stringGroups: [
      {
        id: "main",
        name: "Strings",
        stringNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
        gaugeDirection: "thick-to-thin",
      },
    ],
  },
};

const GRAND_STICK_CLASSIC_TUNING = [
  // Melody strings 1–6
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",

  // Bass strings 7–12
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
] as const;

export const GRAND_STICK_12: TappingInstrumentPreset = {
  id: "chapman-grand-stick-12",
  name: "Grand Stick",
  family: "Chapman Stick",
  description: "Chapman Stick Grand Stick · 12 strings",

  /**
   * Stored in string-number order:
   * 1–6 melody, then 7–12 bass.
   */
  tuning: GRAND_STICK_CLASSIC_TUNING,

  tuningPresets: [
    {
      id: "classic",
      name: "Classic",
      tuning: GRAND_STICK_CLASSIC_TUNING,
    },
  ],
  defaultTuningPresetId: "classic",

  /**
   * 25 physical frets. Fret 1 lies under the damper and is not
   * treated as a normal playable fret.
   */
  frets: 25,

  geometry: {
    frets: 25,
    nonPlayableFrets: [1],

    /**
     * Physical layout across the neck:
     *
     * outer edge                         center                         outer edge
     * B E A D G C  |  C# F# B E A D
     * 12......7     |   6.........1
     *
     * Both groups are thickest at the center and become thinner
     * toward their respective outside edge.
     */
    stringGroups: [
      {
        id: "melody",
        name: "Melody",
        stringNumbers: [1, 2, 3, 4, 5, 6],
        gaugeDirection: "thin-to-thick",
      },
      {
        id: "bass",
        name: "Bass",
        stringNumbers: [7, 8, 9, 10, 11, 12],
        gaugeDirection: "thick-to-thin",
      },
    ],
  },
};

export const INSTRUMENT_PRESETS = [
  TOUCH_GUITAR_U8,
  GRAND_STICK_12,
] as const;

export type InstrumentPresetId =
  (typeof INSTRUMENT_PRESETS)[number]["id"];

export function getDefaultTuningPreset(
  instrument: TappingInstrumentPreset,
): InstrumentTuningPreset {
  return (
    instrument.tuningPresets.find(
      (preset) => preset.id === instrument.defaultTuningPresetId,
    ) ?? instrument.tuningPresets[0]
  );
}
