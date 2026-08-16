# AUTOSYNTH

**Autosynth** is a conducible spatial music sequencer. It flips the traditional relationship between music and time: instead of a timeline dictating when events happen, the music is physically laid out on a looping pseudo-3D track, and **the time emerges from how you drive through it.**

You don't adjust a BPM slider; you hit the gas.

![Autosynth](https://img.shields.io/badge/Status-Playable-brightgreen?style=for-the-badge)

---

## 🏎️ Core Concept: Spatial Sequencing

In a traditional sequencer: `Time → Beats → Musical Events`  
In **Autosynth**: `Distance → Traversal Speed → Musical Events`

The entire track length physically represents exactly **8 measures (32 beats)**. 
- **The grid is spatial**: When you drop a note, it paints a physical mark on the asphalt.
- **The tempo is physical**: Your vehicle acts as the playhead. Driving faster physically covers the distance between notes quicker, natively increasing the BPM.
- **The math is real**: The BPM shown on the HUD is a mathematically true calculation based on your vehicle's units-per-second velocity relative to the 32-beat track length. At top speed, you can reach over **2500 BPM**.

## 🎮 How to Play (Controls)

Autosynth features a stark, brutalist interface. The focus is purely on the interaction between driving and sound composition.

### Driving & Tempo
- `W` / `Up Arrow`: Accelerate (Increase BPM)
- `S` / `Down Arrow`: Brake / Reverse (Decrease BPM)
- `A` / `D` or `Left` / `Right`: Steer smoothly between the 6 lanes (instruments).
- `Shift` + `Left` / `Right`: Instant 2-lane jump for quick rhythmic drops.

### Sequencing (WRITE Mode)
- `Space`: Drop a note on the current lane at your exact physical location. It will automatically quantize to the active Grid Steps.
- `X` (Hold): Erase mode. Drive over existing notes while holding X to delete them.
- `1` - `9`: Instantly load pre-composed drum patterns and synth progressions into the track.

### Real-time Synthesis (DRIVE Mode)
- `D`: Toggle between **WRITE** mode (paint notes) and **DRIVE** mode (live synthesis).
- `Space` (Hold in DRIVE mode): Plays a sustained synthesizer chord based on your current lane. The synth's filter cutoff directly modulates based on your vehicle's speed!

## 🎛️ Sound Studio Menu

Press `M` or `ESC` or `P` at any time to open the brutalist **Sound Studio Menu**.

Here you can:
- **Mute / Solo** any of the 6 instrument lanes.
- Adjust individual **Volume** levels.
- Change the **Preset** (kick types, snare types, etc.) per lane.
- Configure the **Grid Steps**: Change the quantization of the track on the fly (16, 32, 64, 128, or 256 steps). The minimap will instantly update its visual ticks to match your grid.
- Select the **Drive Scale**: Choose the Root Note and Scale (Minor, Major, Blues, Dorian, etc.) that the DRIVE synth will lock into.
- Tweak the **Synthesis Module**: Choose between different oscillator and filter algorithms for the Drive Synth (e.g., Analog Dual, FM Bell, Bass Pulse).

## 🚀 Technical Stack

- **Audio**: Native Web Audio API (`AudioContext`, custom oscillator graphs, biquad filters). No external audio libraries.
- **Graphics**: Native HTML5 `<canvas>` rendering using a custom pseudo-3D raster rasterization algorithm (inspired by classic arcade racers like OutRun). No WebGL.
- **Deployment**: Pure static files (HTML, CSS, JS). Automatically deployed via GitHub Actions to GitHub Pages.

---

*Drive the music.*
