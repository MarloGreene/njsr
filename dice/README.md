# Dice Roller

A polyhedral dice simulator for tabletop gaming with drag-and-drop tower functionality.

## Features

### Dice Types
- **d4**: Four-sided pyramid
- **d6**: Standard six-sided cube
- **d8**: Eight-sided octahedron
- **d10**: Ten-sided die
- **d12**: Twelve-sided dodecahedron
- **d20**: Twenty-sided icosahedron
- **d100**: Percentile die

### Dice Tower
- **Drag & Drop**: Drag dice from the palette to the tower
- **Stack Dice**: Build complex rolls with multiple dice
- **Modifier**: Add flat bonuses/penalties to tower rolls
- **Roll All**: Roll entire tower at once

### Quick d20 Rolls
- **One-Handed Attack**: Pre-configured roll button
- **Two-Handed Attack**: Pre-configured roll button
- **Ranged Attack**: Pre-configured roll button
- **Initiative**: Pre-configured roll button
- **Custom Modifier**: Set your own d20 modifier

### Results Mat
- **Individual Results**: See each die's result
- **Total Calculation**: Automatic sum with modifiers
- **Roll History**: Track previous rolls

### Additional Features
- **Visual Animations**: Dice roll animations
- **Clear Functions**: Reset tower or history
- **SVG Graphics**: Clean, scalable dice visuals

## Usage

1. Open `index.html` in any web browser
2. **Quick Roll**: Use the d20 section for fast attack/initiative rolls
3. **Custom Roll**: Drag dice to the tower, set modifier, click "Roll All"
4. View results on the Results Mat
5. Check history for previous rolls

## Files

- `index.html` - Main structure
- `dice.css` - Styling and dice visuals
- `dice.js` - Rolling logic and drag-drop handling

## Technical Details

- Cryptographically secure random (where available)
- HTML5 Drag and Drop API
- SVG dice graphics
- Vanilla JavaScript
- No dependencies

## Privacy

- Roll history stored in localStorage
- No external connections
- No tracking

## License

MIT License
