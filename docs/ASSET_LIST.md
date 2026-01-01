# Cosmic Cadet Academy - Asset List & Guidelines

## Table of Contents
1. [Asset Overview](#asset-overview)
2. [Sprite Sheets](#sprite-sheets)
3. [Background Images](#background-images)
4. [UI Elements](#ui-elements)
5. [Audio Assets](#audio-assets)
6. [Data Files](#data-files)
7. [Asset Creation Guidelines](#asset-creation-guidelines)
8. [Copyright & Licensing](#copyright--licensing)

---

## Asset Overview

### Directory Structure

```
public/assets/
├── images/
│   ├── sprites/          # Animated characters and objects
│   ├── backgrounds/      # Level backgrounds and parallax layers
│   ├── ui/              # Buttons, panels, icons
│   └── tilesets/        # Tilemap graphics
├── audio/
│   ├── sfx/             # Sound effects
│   └── music/           # Background music tracks
└── data/
    ├── levels/          # Level configuration JSON
    └── achievements.json
```

### Format Standards

| Asset Type | Format | Notes |
|------------|--------|-------|
| Sprites | PNG-24 | Transparency required |
| Backgrounds | PNG or JPEG | JPEG for photos, PNG for illustrated |
| Audio SFX | MP3 | 44.1kHz, 128kbps |
| Music | MP3 | 44.1kHz, 192kbps |
| Data | JSON | UTF-8 encoded |

---

## Sprite Sheets

### Player Sprites

| Asset | Filename | Size | Frames | Notes |
|-------|----------|------|--------|-------|
| Player Ship | `player.png` | 512x256 | 16 | 64x64 per frame |
| Player Atlas | `player-atlas.png` | 1024x512 | - | All animations |
| Player Atlas JSON | `player-atlas.json` | - | - | Frame definitions |

**Frame Layout for `player.png`:**
```
┌──────┬──────┬──────┬──────┐
│ Idle │ Idle │ Idle │ Idle │  Row 1: Idle animation (4 frames)
│  1   │  2   │  3   │  4   │
├──────┼──────┼──────┼──────┤
│ Move │ Move │ Move │ Move │  Row 2: Movement (4 frames)
│  1   │  2   │  3   │  4   │
├──────┼──────┼──────┼──────┤
│ Boost│ Boost│ Boost│ Boost│  Row 3: Boost mode (4 frames)
│  1   │  2   │  3   │  4   │
├──────┼──────┼──────┼──────┤
│ Dmg  │ Dmg  │ Victory     │  Row 4: Damage (2), Victory (2)
│  1   │  2   │  1   │  2   │
└──────┴──────┴──────┴──────┘
```

### Star Sprites

| Asset | Filename | Size | Frames | Notes |
|-------|----------|------|--------|-------|
| Bronze Star | `star-bronze.png` | 256x32 | 8 | 32x32 per frame, spinning |
| Silver Star | `star-silver.png` | 256x32 | 8 | 32x32 per frame, pulsing |
| Gold Star | `star-gold.png` | 384x48 | 8 | 48x48 per frame, glowing |
| Stellar Core | `stellar-core.png` | 512x64 | 8 | 64x64 per frame, rotating |

### Companion & NPC Sprites

| Asset | Filename | Size | Frames | Notes |
|-------|----------|------|--------|-------|
| ORBIT | `orbit.png` | 384x96 | 8 | 48x48, idle + talking |
| Commander Nova | `npc-nova.png` | 256x128 | 4 | 64x128, portrait |
| Engineer Bolt | `npc-bolt.png` | 256x128 | 4 | 64x128, portrait |
| Dr. Cosma | `npc-cosma.png` | 256x128 | 4 | 64x128, portrait |

### Obstacles & Hazards

| Asset | Filename | Size | Frames | Notes |
|-------|----------|------|--------|-------|
| Asteroid (Small) | `asteroid-sm.png` | 256x64 | 4 | 64x64, rotating variants |
| Asteroid (Large) | `asteroid-lg.png` | 384x96 | 4 | 96x96, rotating variants |
| Space Mine | `mine.png` | 256x64 | 4 | 64x64, pulsing |
| Laser Barrier | `laser.png` | 128x256 | 4 | Horizontal beam |

### Effects

| Asset | Filename | Size | Frames | Notes |
|-------|----------|------|--------|-------|
| Explosion | `explosion.png` | 512x64 | 8 | 64x64 per frame |
| Sparkle | `sparkle.png` | 192x32 | 6 | 32x32 per frame |
| Boost Trail | `trail.png` | 256x32 | 8 | Particle effect |
| Shield Hit | `shield-hit.png` | 256x64 | 4 | Defensive effect |

---

## Background Images

### Space Backgrounds

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Space 1 | `bg-space-1.png` | 1920x1080 | Tutorial zone, friendly |
| Space 2 | `bg-space-2.png` | 1920x1080 | Deep space, mysterious |
| Nebula | `bg-nebula.png` | 1920x1080 | Colorful gas clouds |
| Asteroid Field | `bg-asteroid-field.png` | 1920x1080 | Dangerous zone |
| Station Interior | `bg-station.png` | 1920x1080 | Metal corridors |
| Mars Orbit | `bg-planet-mars.png` | 1920x1080 | Red planet visible |
| Jupiter Orbit | `bg-planet-jupiter.png` | 1920x1080 | Gas giant |

### Parallax Layers

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Stars Layer 1 | `parallax-stars-1.png` | 1920x1080 | Distant, slow |
| Stars Layer 2 | `parallax-stars-2.png` | 1920x1080 | Closer, faster |
| Nebula Layer | `parallax-nebula.png` | 1920x1080 | Transparent overlay |
| Dust Particles | `parallax-dust.png` | 1920x1080 | Foreground effect |

---

## UI Elements

### Buttons

| Asset | Filename | Size | States | Notes |
|-------|----------|------|--------|-------|
| Play Button | `btn-play.png` | 280x60 | Normal | Primary action |
| Play Hover | `btn-play-hover.png` | 280x60 | Hover | Glowing version |
| Settings | `btn-settings.png` | 60x60 | - | Gear icon |
| Leaderboard | `btn-leaderboard.png` | 60x60 | - | Trophy icon |
| Back | `btn-back.png` | 60x60 | - | Arrow left |
| Pause | `btn-pause.png` | 50x50 | - | Pause bars |
| Hint | `btn-hint.png` | 50x50 | - | Lightbulb |

### Panels & Frames

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Main Panel | `panel-main.png` | 600x400 | 9-slice capable |
| Dialog Panel | `panel-dialog.png` | 800x200 | NPC dialogue |
| Score Panel | `panel-score.png` | 300x100 | HUD element |
| Level Frame | `level-frame.png` | 120x120 | Level select button |

### HUD Elements

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Star Counter BG | `hud-star-counter.png` | 150x50 | Score display |
| Health Bar BG | `hud-health.png` | 200x40 | Life container |
| Heart Full | `heart-full.png` | 40x40 | Full health |
| Heart Empty | `heart-empty.png` | 40x40 | Lost health |
| Boost Meter | `hud-boost.png` | 100x20 | Boost energy |

### Level Select

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Level Locked | `level-locked.png` | 100x100 | Padlock overlay |
| Level Unlocked | `level-unlocked.png` | 100x100 | Available to play |
| Level Completed | `level-completed.png` | 100x100 | Stars earned |
| Star Empty | `star-empty-sm.png` | 20x20 | Completion rating |
| Star Filled | `star-filled-sm.png` | 20x20 | Completion rating |

### Virtual Controls

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Joystick Base | `joystick-base.png` | 120x120 | Touch control outer |
| Joystick Thumb | `joystick-thumb.png` | 60x60 | Touch control inner |

### Logo & Branding

| Asset | Filename | Size | Notes |
|-------|----------|------|-------|
| Game Logo | `logo.png` | 600x200 | Main title |
| Loading BG | `loading-background.png` | 1920x1080 | Preloader |
| Spinner | `spinner.png` | 512x64 | 8 frames, 64x64 |
| App Icon | `icon-1024.png` | 1024x1024 | Store listing |
| App Icon | `icon-512.png` | 512x512 | Alternative |
| App Icon | `icon-192.png` | 192x192 | PWA |

---

## Audio Assets

### Sound Effects

| Asset | Filename | Duration | Notes |
|-------|----------|----------|-------|
| Star Collect | `star-collect.mp3` | 0.3s | Chime sound |
| Gold Star | `star-gold.mp3` | 0.5s | Special chime |
| Boost Activate | `boost.mp3` | 0.4s | Whoosh/power |
| Hit/Damage | `hit.mp3` | 0.3s | Impact sound |
| Button Click | `button-click.mp3` | 0.1s | UI interaction |
| Success | `success.mp3` | 0.5s | Positive feedback |
| Fail | `fail.mp3` | 0.4s | Negative feedback |
| Level Complete | `level-complete.mp3` | 2.0s | Victory fanfare |
| Achievement | `achievement.mp3` | 1.5s | Unlock sound |
| Hint | `hint.mp3` | 0.3s | Notification |
| Menu Navigate | `menu-nav.mp3` | 0.1s | Selection change |
| Explosion | `explosion.mp3` | 0.8s | Obstacle hit |

### Background Music

| Asset | Filename | Duration | Notes |
|-------|----------|----------|-------|
| Menu Theme | `menu-theme.mp3` | 2:00 | Loops, calm |
| Game Theme 1 | `game-theme-1.mp3` | 3:00 | Loops, upbeat |
| Game Theme 2 | `game-theme-2.mp3` | 3:00 | Loops, adventurous |
| Boss Theme | `boss-theme.mp3` | 2:30 | Loops, intense |
| Victory | `victory.mp3` | 0:30 | Level complete |

---

## Data Files

### Level Configuration

**Location:** `public/assets/data/levels/`

**Format:** `{chapter}-{level}.json`

```json
{
    "id": "1-1",
    "name": "First Steps",
    "chapter": 1,
    "level": 1,
    "worldWidth": 2560,
    "worldHeight": 1440,
    "background": "bg-space-1",
    "music": "game-theme-1",
    "playerStart": { "x": 200, "y": 700 },
    "stars": [
        { "x": 400, "y": 600, "type": "bronze" },
        { "x": 600, "y": 500, "type": "bronze" }
    ],
    "obstacles": [
        { "x": 800, "y": 600, "texture": "asteroid", "rotate": true }
    ],
    "hint": "Follow the star trail to find your way!",
    "parTime": 120
}
```

**Files Required:**
- `1-1.json` through `8-5.json` (40 total)

### Achievement Definitions

**Location:** `public/assets/data/achievements.json`

```json
{
    "achievements": [
        {
            "id": "first_star",
            "name": "Star Seeker",
            "description": "Collect your first star",
            "iconId": "star",
            "points": 10
        },
        {
            "id": "hundred_stars",
            "name": "Star Collector",
            "description": "Collect 100 stars",
            "iconId": "stars-100",
            "points": 50
        }
    ]
}
```

---

## Asset Creation Guidelines

### Sprite Creation

1. **Resolution**: Work at 2x target size, then scale down
2. **Transparency**: Use PNG-24 with alpha channel
3. **Consistency**: Maintain consistent lighting direction (top-left)
4. **Outline**: Optional 1-2px dark outline for visibility
5. **Frame Count**: Use powers of 2 when possible (4, 8, 16)

### Color Guidelines

```
Primary Palette:
- Deep Space:  #0A0A2E
- Cosmic:      #2D1B4E
- Cyan:        #00FFFF
- Pink:        #FF6B9D
- Gold:        #FFD700

Avoid:
- Pure black (#000000) - use deep space instead
- Pure white (#FFFFFF) - use off-white (#F0F0F8)
- Neon colors that strain eyes
```

### Audio Guidelines

1. **Format**: MP3 for broad compatibility
2. **Sample Rate**: 44.1kHz
3. **Bit Rate**: 128kbps for SFX, 192kbps for music
4. **Normalization**: Normalize to -3dB peak
5. **Loop Points**: Music must loop seamlessly

### File Naming

```
Pattern: {type}-{name}-{variant}.{ext}

Examples:
- btn-play.png
- btn-play-hover.png
- bg-space-1.png
- sfx-star-collect.mp3
- music-menu-theme.mp3
```

---

## Copyright & Licensing

### Original Content Guidelines

To avoid copyright issues, all assets must be:

1. **Created Original**: Commission or create in-house
2. **Licensed Appropriately**: Use CC0, CC-BY, or commercial licenses
3. **Documented**: Maintain license records

### Recommended Sources for Assets

**Graphics:**
- [OpenGameArt.org](https://opengameart.org) - CC0/CC-BY
- [Kenney.nl](https://kenney.nl) - CC0 public domain
- [itch.io Asset Packs](https://itch.io/game-assets) - Various licenses
- Commission from artists on Fiverr, ArtStation

**Audio:**
- [Freesound.org](https://freesound.org) - CC0/CC-BY
- [OpenGameArt.org](https://opengameart.org) - Various
- [Incompetech](https://incompetech.com) - Royalty-free music
- Commission from composers

### License Documentation Template

```
asset_licenses.txt:

ASSET: player.png
SOURCE: Custom created
ARTIST: [Name]
LICENSE: Work for hire (owned)
DATE: 2024-XX-XX

ASSET: star-collect.mp3
SOURCE: Freesound.org
AUTHOR: [Username]
LICENSE: CC0
URL: [Link]
```

### Assets to Create vs. License

| Category | Recommendation |
|----------|----------------|
| Player Ship | Create (unique identity) |
| Stars | Create (simple, iconic) |
| Backgrounds | License or create |
| UI Buttons | Create (consistent style) |
| Sound Effects | License (CC0) |
| Music | License or commission |
| Logo | Create (brand identity) |

---

*Document Version: 1.0*
*Last Updated: 2024*
