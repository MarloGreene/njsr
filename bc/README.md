# Battle Buddy Checker

A military unit organization and status tracking tool for keeping tabs on your battle buddies.

## Features

- **Multiple Organization Views**: Toggle between Platoon, Section, and Custom Squad layouts
- **Quick Name Entry**: Add personnel to your roster with simple text input
- **Drag & Drop Assignment**: Assign personnel to positions by dragging from roster to org chart
- **Status Tracking**: Color-coded status indicators (Green/Yellow/Red/Black) for contact status
- **Detailed Personnel Info**: Click any person to add callsign, contact info, photo URL, and notes
- **Persistent Storage**: All data saved locally in your browser

## How to Use

1. **Add Personnel**: Enter names in the input field and press Enter or click Add
2. **Assign Positions**: Drag names from the roster to positions in the org chart
3. **Set Status**: Right-click any person to cycle through status colors
4. **Edit Details**: Click any person to open the details modal
5. **Remove Assignment**: Double-click a person in a position to return them to roster

## Status Colors

- **Green**: Full contact / good status
- **Yellow**: Sporadic contact / needs attention
- **Red**: No contact / urgent
- **Black**: Deceased / out of action

## Organization Structures

### Platoon View
- Platoon HQ (Leader, Sergeant, Medic, RTO)
- 3 Squads, each with:
  - Squad Leader
  - 3 Fireteams (Leader + 3 Riflemen each)

### Section View
- Section HQ (Leader, 2IC, Medic)
- 2 Teams (Leader + 4 Riflemen each)

### Custom Squad View
- Flexible 10-position squad layout

## Privacy

All data is stored locally in your browser using localStorage. No data is transmitted or stored on any server.