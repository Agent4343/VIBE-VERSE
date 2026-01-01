# Cosmic Cadet Academy - Game Design Document

## Table of Contents
1. [Overview](#overview)
2. [Storyline](#storyline)
3. [Key Characters](#key-characters)
4. [Core Mechanics](#core-mechanics)
5. [Level Progression](#level-progression)
6. [Puzzle & Exploration Integration](#puzzle--exploration-integration)
7. [Educational Mini-Games](#educational-mini-games)
8. [Star Collection System](#star-collection-system)

---

## Overview

| Attribute | Details |
|-----------|---------|
| **Title** | Cosmic Cadet Academy |
| **Genre** | Puzzle-Adventure / Educational |
| **Target Age** | 10-14 years old |
| **Platforms** | iOS, Android (cross-platform) |
| **Engine** | Phaser 3 (HTML5 Canvas/WebGL) |
| **Backend** | Node.js with Express & Socket.IO |
| **Art Style** | Bright, cartoonish, space-themed |
| **Session Length** | 5-15 minutes per level |

### Game Pillars
1. **Learn Through Play** - Space science and logical reasoning embedded in gameplay
2. **Exploration & Discovery** - Open-ended levels encouraging curiosity
3. **Achievement & Collection** - Stars, badges, and progression to maintain engagement
4. **Safe & Positive** - Age-appropriate content with no harmful monetization

---

## Storyline

### Setting
The year is 2247. Earth has established the **Cosmic Cadet Academy (CCA)**, an elite training facility orbiting Jupiter's moon Europa. Young cadets from across the solar system come here to learn the skills needed to become Space Rangers - the peacekeepers and explorers of the galaxy.

### Main Plot
**You are Cadet Starling**, a promising new recruit who has just arrived at the Academy. On your first day, a mysterious cosmic storm knocks the Academy's navigation systems offline, scattering critical **Stellar Cores** (collectible stars) across different sectors of space.

Without these Stellar Cores, the Academy cannot power its shields, leaving it vulnerable to asteroid impacts. Commander Nova assigns you a critical mission: travel through various cosmic zones, solve puzzles to recover the Stellar Cores, and save the Academy!

### Story Progression

| Chapter | Zone | Theme | Story Beat |
|---------|------|-------|------------|
| **1** | Training Grounds | Tutorial/Basics | Learn the ropes, meet your crew |
| **2** | Asteroid Belt Alpha | Navigation | First real mission, face meteor puzzles |
| **3** | Mars Station Omega | Engineering | Repair station systems, meet Engineer Bolt |
| **4** | Jupiter's Eye | Physics | Navigate gravity wells, learn about gas giants |
| **5** | Saturn's Rings | Mathematics | Calculate orbital paths through ring debris |
| **6** | Neptune's Deep | Biology | Discover alien life, pattern recognition |
| **7** | Kuiper Station | Chemistry | Fuel synthesis puzzles |
| **8** | The Dark Nebula | Logic Mastery | Final challenge combining all skills |

### Narrative Hooks
- **Mystery Element**: Who or what caused the cosmic storm? Hints scattered throughout
- **Character Arcs**: NPCs grow and develop as you help them
- **Player Choice**: Optional side missions affect dialogue and endings
- **Collectible Lore**: Find data logs revealing Academy history

---

## Key Characters

### Playable Character

#### Cadet Starling (Player Avatar)
- **Customizable**: Choose gender, skin tone, hair style, suit colors
- **Personality**: Brave, curious, determined
- **Abilities**: Piloting, puzzle-solving, communication
- **Upgrade Path**: Unlock new suit abilities (boost, shield, scanner)

### Supporting Cast

#### Commander Nova
- **Role**: Academy Leader, Mission Giver
- **Personality**: Stern but caring, experienced, wise
- **Visual**: Gray hair, decorated uniform, cybernetic eye
- **Function**: Provides main quest objectives, tutorials, encouragement

#### ORBIT (Onboard Robotic Buddy for Interactive Training)
- **Role**: AI Companion, Hint System
- **Personality**: Cheerful, curious, occasionally glitchy
- **Visual**: Floating spherical robot with expressive LED face
- **Function**: Hints, tutorials, comic relief, educational facts

#### Engineer Bolt
- **Role**: Mars Station Chief, Puzzle Guide
- **Personality**: Enthusiastic, inventive, slightly scatterbrained
- **Visual**: Four-armed alien (helps with complex repairs)
- **Function**: Introduces engineering/physics puzzles

#### Dr. Cosma
- **Role**: Science Officer, Educational Content
- **Personality**: Patient, excited about discovery, nurturing
- **Visual**: Human scientist with holographic displays
- **Function**: Explains space science, provides context for puzzles

#### Nebula (Mysterious Figure)
- **Role**: Antagonist/Secret Ally
- **Personality**: Unknown initially, enigmatic
- **Visual**: Shadowy figure in dark spacesuit
- **Function**: Creates obstacles, later revealed to be testing cadets

### Minor Characters
- **Other Cadets**: Friendly NPCs for optional cooperative moments
- **Station Keepers**: NPCs at various locations providing side quests
- **Alien Creatures**: Friendly beings to interact with on different planets

---

## Core Mechanics

### 1. Movement & Navigation

```
Movement System:
├── Spaceship Mode (between zones)
│   ├── Tap-to-move navigation
│   ├── Fuel management (strategic element)
│   └── Obstacle avoidance (asteroids, debris)
│
└── Character Mode (on stations/planets)
    ├── Virtual joystick (mobile-friendly)
    ├── Tap-to-interact with objects
    └── Jump/boost for platforming sections
```

### 2. Puzzle Interaction

| Puzzle Type | Input Method | Feedback |
|-------------|--------------|----------|
| Pattern Matching | Drag & Drop | Visual + Audio confirmation |
| Logic Gates | Toggle switches | Circuit lights up |
| Sequence | Tap in order | Numbers appear |
| Rotation | Swipe gestures | Smooth rotation animation |
| Math Problems | Number pad input | Checkmark/X animation |

### 3. Star Collection

Stars are the primary collectible and progression currency:

- **Bronze Stars** (Common): Found in open exploration, 1 point each
- **Silver Stars** (Rare): Hidden in secret areas, 5 points each
- **Gold Stars** (Epic): Awarded for puzzle completion, 10 points each
- **Stellar Cores** (Legendary): Main quest items, 50 points + story progression

### 4. Scoring System

```javascript
// Score calculation formula
totalScore = (bronzeStars * 1) + (silverStars * 5) + (goldStars * 10) +
             (stellarCores * 50) + (timeBonus) + (hintPenalty)

// Time bonus: Complete level under par time
timeBonus = Math.max(0, (parTime - completionTime) * 10)

// Hint penalty: Each hint reduces final score
hintPenalty = hintsUsed * -5
```

### 5. Health & Lives System

- **Shield Energy**: 3 hits before respawn at checkpoint
- **Checkpoints**: Auto-save progress, generous placement
- **No permanent death**: Kids shouldn't feel frustrated
- **Recovery items**: Shield recharges found throughout levels

### 6. Upgrade System

| Upgrade | Cost (Stars) | Effect |
|---------|--------------|--------|
| Speed Boost | 50 | 20% faster movement |
| Scanner Range | 75 | Reveals hidden stars nearby |
| Shield+ | 100 | 4 hits instead of 3 |
| Fuel Efficiency | 125 | 25% less fuel consumption |
| Hint Token | 25 | One free hint |

---

## Level Progression

### Difficulty Curve

```
Difficulty
    ^
    |                                    ****
    |                               *****
    |                          *****
    |                     ******
    |                *****
    |           *****
    |      *****
    | *****
    +-----------------------------------------> Level
      1  2  3  4  5  6  7  8  9  10  ...  40

      |-------|--------|---------|----------|
       Tutorial  Easy    Medium     Hard
       (1-5)    (6-15)   (16-30)   (31-40)
```

### Level Structure

Each chapter contains 5 levels:
1. **Introduction Level**: New mechanic introduced with heavy guidance
2. **Practice Level**: Mechanic used in simple scenarios
3. **Challenge Level**: Mechanic combined with previous skills
4. **Exploration Level**: Open-ended, many stars to collect
5. **Boss Puzzle**: Complex puzzle combining chapter's concepts

### Unlock Requirements

| Chapter | Stars Required | Prerequisite |
|---------|----------------|--------------|
| 1 | 0 | None |
| 2 | 20 | Complete Chapter 1 |
| 3 | 60 | Complete Chapter 2 |
| 4 | 120 | Complete Chapter 3 |
| 5 | 200 | Complete Chapter 4 |
| 6 | 300 | Complete Chapter 5 |
| 7 | 420 | Complete Chapter 6 |
| 8 | 560 | Complete all previous chapters |

### Level Design Principles

1. **Clear Goals**: Player always knows what to do next
2. **Multiple Paths**: Allow different approaches to solutions
3. **Risk/Reward**: Optional challenges for bonus stars
4. **Incremental Complexity**: One new element per level max
5. **Celebration**: Big visual/audio reward for completion

---

## Puzzle & Exploration Integration

### The Puzzle-Exploration Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE GAMEPLAY LOOP                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│    │ EXPLORE  │───>│  FIND    │───>│  SOLVE   │             │
│    │  Zone    │    │  Puzzle  │    │  Puzzle  │             │
│    └──────────┘    └──────────┘    └──────────┘             │
│         ^                               │                    │
│         │                               v                    │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│    │  NEW     │<───│  UNLOCK  │<───│ COLLECT  │             │
│    │  AREA    │    │  PATH    │    │  STARS   │             │
│    └──────────┘    └──────────┘    └──────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Exploration Mechanics

1. **Fog of War**: Unexplored areas are dimmed/hidden
2. **Points of Interest**: Radar blips hint at discoveries
3. **Environmental Storytelling**: Visual clues guide exploration
4. **Backtracking Rewards**: New abilities open old areas

### Puzzle Integration Examples

#### Example 1: The Asteroid Navigation Puzzle
- **Exploration**: Fly through asteroid field collecting data fragments
- **Puzzle**: Arrange fragments to reveal safe path coordinates
- **Reward**: Access to hidden star cache + story progression

#### Example 2: The Power Grid Puzzle
- **Exploration**: Find broken power nodes across station
- **Puzzle**: Connect circuit paths to restore power (logic puzzle)
- **Reward**: Doors open, new areas accessible, stars collected

#### Example 3: The Alien Language Puzzle
- **Exploration**: Discover alien symbols in various locations
- **Puzzle**: Pattern match symbols to decode message
- **Reward**: Alien friend joins you, hints at secrets

### Environmental Puzzles

| Environment | Puzzle Type | Exploration Element |
|-------------|-------------|---------------------|
| Space | Navigation/Fuel | Finding fuel caches |
| Asteroids | Physics/Trajectory | Hidden caves |
| Stations | Circuits/Logic | Locked rooms |
| Planets | Pattern/Sequence | Ancient ruins |
| Nebula | Color/Light | Visibility challenges |

---

## Educational Mini-Games

### Design Philosophy
- Learning should feel like playing, not studying
- Reward correct answers with immediate positive feedback
- Incorrect answers provide gentle correction with explanation
- Difficulty adapts to player performance

### Mini-Game Categories

#### 1. Orbital Mechanics Trainer
**Concept**: Launch satellites into correct orbits

```
Learning Objectives:
- Gravity affects trajectory
- Orbital velocity concepts
- Stable vs decaying orbits

Gameplay:
1. Adjust launch angle (0-360°)
2. Set thrust power (1-10)
3. Watch satellite trajectory
4. Iterate until stable orbit achieved

Difficulty Progression:
- Level 1: Simple circular orbits
- Level 2: Elliptical orbits
- Level 3: Avoid obstacles
- Level 4: Rendezvous with station
```

#### 2. Solar System Sorter
**Concept**: Arrange planets and objects correctly

| Task Type | Example |
|-----------|---------|
| Distance Sort | Order planets by distance from Sun |
| Size Sort | Order planets by diameter |
| Property Match | Match planet to # of moons |
| Timeline | Order space missions chronologically |

#### 3. Constellation Constructor
**Concept**: Connect stars to form constellations

```
Gameplay:
1. View star field with bright points
2. Select stars in correct order
3. Lines appear connecting them
4. Constellation image overlays when complete
5. Learn constellation name and mythology

Educational Content:
- 15 major constellations
- Greek/Roman mythology connections
- How to find them in real night sky
```

#### 4. Fuel Calculator
**Concept**: Math puzzles framed as fuel management

```
Problem Example:
"Your ship needs 450 units of fuel to reach Mars.
 You have 3 fuel pods. Pod A has 180 units.
 Pod B has 95 units. How much fuel must Pod C have?"

Answer: 175 units (450 - 180 - 95 = 175)

Difficulty scales with:
- Number of variables
- Operation complexity (add → subtract → multiply → divide)
- Word problem complexity
```

#### 5. Gravity Well Navigator
**Concept**: Understand gravitational attraction

```
Gameplay:
- Place/remove mass objects on grid
- Watch how they affect particle streams
- Guide particles to goal using gravity
- Learn: More mass = more pull

Real Science:
- How planets form
- Why moons orbit planets
- Black hole basics (advanced levels)
```

#### 6. Mission Control Sequencer
**Concept**: Logic and sequencing puzzles

```
Task: Arrange mission steps in correct order

Example Mission: "Land on Moon"
Steps (shuffled):
- [ ] Fire retro rockets
- [ ] Deploy landing legs
- [ ] Begin descent
- [ ] Touchdown confirmed
- [ ] Enter lunar orbit

Correct Order: 3, 5, 1, 2, 4

Learning: Understanding procedures, cause/effect
```

#### 7. Element Combiner
**Concept**: Basic chemistry through crafting

```
Combine elements to create rocket fuel:

H₂ + O₂ → H₂O (Water)
H₂ + H₂ + O₂ → Fuel Mix

Players drag elements to reaction chamber
Visual effects show combination
Result used to power next mission segment

Educational Focus:
- Basic elements
- Simple reactions
- Conservation of matter
```

#### 8. Signal Decoder
**Concept**: Pattern recognition and codes

```
Intercept alien transmission:
●●○ ●○● ○●● = ?

Decode using provided key:
●●○ = A
●○● = B
○●● = C

Answer: ABC

Advanced: Binary to decimal conversion
Educational: How real space communication works
```

### Mini-Game Integration

Mini-games appear naturally within levels:
- **Locked doors** require puzzle completion
- **ORBIT challenges** pop up for bonus stars
- **Story moments** use mini-games for interaction
- **Daily challenges** offer rotating mini-game focus

### Adaptive Difficulty

```javascript
// Pseudo-code for adaptive difficulty
function adjustDifficulty(playerPerformance) {
    const recentAccuracy = getRecentAccuracy(lastAttempts: 5);

    if (recentAccuracy > 0.9) {
        difficulty += 0.5; // Player is excelling
    } else if (recentAccuracy < 0.5) {
        difficulty -= 0.5; // Player is struggling
    }

    return clamp(difficulty, minLevel, maxLevel);
}
```

---

## Star Collection System

### Star Types & Distribution

```
┌─────────────────────────────────────────────────────────┐
│                  STAR DISTRIBUTION PER LEVEL             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Bronze Stars (15-25 per level)                         │
│  ├── Open exploration areas: 10-15                      │
│  ├── Behind easy obstacles: 3-5                         │
│  └── Bonus paths: 2-5                                   │
│                                                          │
│  Silver Stars (3-5 per level)                           │
│  ├── Hidden areas: 1-2                                  │
│  ├── Time challenges: 1                                 │
│  └── Optional puzzles: 1-2                              │
│                                                          │
│  Gold Stars (1-3 per level)                             │
│  ├── Main puzzle completion: 1                          │
│  ├── Perfect score bonus: 1                             │
│  └── Secret discovery: 1                                │
│                                                          │
│  Stellar Core (1 per chapter)                           │
│  └── Chapter boss puzzle: 1                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Collection Mechanics

1. **Proximity Collection**: Stars within range auto-collect
2. **Magnetic Pull**: Upgrade increases collection radius
3. **Visual Trail**: Stars leave sparkle trail when collected
4. **Sound Design**: Satisfying chime, pitch increases with combo

### Star Display & Tracking

```
┌────────────────────────────────────────┐
│  Level 3-2: Asteroid Alley             │
├────────────────────────────────────────┤
│                                        │
│  ★ Bronze: 18/25  ⬤⬤⬤⬤⬤⬤⬤⬤⬤○○       │
│  ☆ Silver: 2/5    ⬤⬤○○○               │
│  ✦ Gold:   1/3    ⬤○○                 │
│                                        │
│  Completion: 67%  ████████░░░░         │
│                                        │
└────────────────────────────────────────┘
```

### Star Usage

| Use | Cost | Description |
|-----|------|-------------|
| Unlock Upgrades | Varies | Permanent ship improvements |
| Buy Hints | 25 | Get help on tough puzzles |
| Cosmetic Items | 50-200 | Suit colors, ship skins |
| Skip Level | 100 | Only after 3 failed attempts |
| Unlock Bonus Content | 500 | Extra levels, lore, art |

### Engagement Hooks

1. **Daily Star Bonus**: First login gives 10 bonus stars
2. **Streak Rewards**: Consecutive days multiply bonus
3. **Completion Percentage**: Per-level star collection tracking
4. **Achievements**: Bonus stars for milestones
5. **Leaderboards**: Weekly star collection rankings

---

## Appendix: Quick Reference

### Controls Summary

| Action | Touch Input | Alternative |
|--------|-------------|-------------|
| Move | Virtual joystick | Tap to move |
| Interact | Tap object | Long press for details |
| Puzzle | Drag & drop | Tap to select, tap to place |
| Menu | Top-left icon | Swipe from edge |
| ORBIT Hint | ORBIT button | Shake device |

### Age-Appropriate Guidelines

- **No violence**: Obstacles slow/stop, never "kill"
- **No timers under pressure**: Bonus time, not penalty time
- **Inclusive language**: Gender-neutral options, diverse cast
- **Safe multiplayer**: No direct chat, preset phrases only
- **Parental controls**: Time limits, purchase locks

### Session Flow

```
Average 10-minute session:
├── 0:00 - 0:30  │ Launch, continue or new level
├── 0:30 - 2:00  │ Exploration phase
├── 2:00 - 5:00  │ Main puzzle solving
├── 5:00 - 7:00  │ Star collection sweep
├── 7:00 - 9:00  │ Optional mini-game
└── 9:00 - 10:00 │ Victory, rewards, save
```

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: Cosmic Cadet Academy Development Team*
