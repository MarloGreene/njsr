# RunWritr - Future Plans

## Vim-Style Navigation Mode - IMPLEMENTED (Basic)

### What's Done
- Normal/Insert mode toggle with `Escape` and `i/a/o/O/I/A`
- Navigation: `h j k l`, `w b e`, `0 $ ^`, `gg G`, count prefixes
- Editing: `x`, `dd/dw/d$/D`, `yy/yw/y$`, `p/P`, `u`
- Clipboard animation when in normal mode
- Thinking animation when building commands
- Editing animation when executing actions

### Overview
Add optional vim-style keyboard navigation for the text editor. This would allow users who are comfortable with vim to navigate and edit text without leaving the keyboard home row.

### Core Features (Phase 1 - Basic Navigation)

**Mode System:**
- `Normal` mode - navigation and commands (default when toggled on)
- `Insert` mode - regular typing
- Visual indicator showing current mode (status bar or cursor style)

**Mode Switching:**
- `i` - enter Insert mode at cursor
- `a` - enter Insert mode after cursor
- `o` - new line below, enter Insert mode
- `O` - new line above, enter Insert mode
- `Escape` - return to Normal mode

**Basic Navigation (Normal mode):**
- `h` `j` `k` `l` - left, down, up, right
- `w` - jump to next word start
- `b` - jump to previous word start
- `e` - jump to word end
- `0` - jump to line start
- `$` - jump to line end
- `^` - jump to first non-whitespace
- `gg` - jump to document start
- `G` - jump to document end

### Phase 2 - Editing Commands

**Delete:**
- `x` - delete character under cursor
- `dd` - delete entire line
- `dw` - delete word
- `d$` or `D` - delete to end of line

**Change:**
- `cw` - change word (delete + insert mode)
- `cc` - change entire line
- `c$` or `C` - change to end of line

**Copy/Paste:**
- `yy` - yank (copy) line
- `yw` - yank word
- `p` - paste after cursor
- `P` - paste before cursor

**Undo/Redo:**
- `u` - undo
- `Ctrl+r` - redo

### Phase 3 - Advanced Features

**Search:**
- `/` - search forward
- `?` - search backward
- `n` - next match
- `N` - previous match

**Counts:**
- `5j` - move down 5 lines
- `3dw` - delete 3 words
- `10G` - go to line 10

**Visual Mode:**
- `v` - character-wise visual selection
- `V` - line-wise visual selection

**Marks:**
- `ma` - set mark 'a' at cursor
- `'a` - jump to mark 'a'

### Implementation Notes

**Technical Approach:**
```javascript
const vimState = {
    enabled: false,
    mode: 'normal', // 'normal', 'insert', 'visual'
    commandBuffer: '', // for multi-key commands like 'gg', '5j'
    register: '', // yanked text
    marks: {} // named positions
};

// Intercept keydown in Normal mode
editor.addEventListener('keydown', (e) => {
    if (!vimState.enabled || vimState.mode === 'insert') return;

    e.preventDefault();
    handleVimCommand(e.key);
});
```

**Cursor Handling:**
- Use `selectionStart` and `selectionEnd` to track cursor position
- For block cursor in Normal mode, could use a custom overlay or CSS trick
- Alternative: just change cursor color/style as indicator

**Command Buffer:**
- Buffer keystrokes for multi-character commands
- Parse when command is complete or timeout after 1 second
- Examples: `gg`, `dd`, `5j`, `d3w`

**Toggle:**
- Add keyboard shortcut to toggle vim mode (maybe `Ctrl+Alt+V`?)
- Or button in controls area
- Persist preference in localStorage

### UI Considerations

- Mode indicator in stats bar: `-- NORMAL --` or `-- INSERT --`
- Different cursor style per mode (block vs line)
- Maybe subtle color change to editor background?
- Help popup with `?` or `:help`

### Challenges

1. **Textarea limitations** - can't easily do block cursor, may need contenteditable
2. **Browser shortcuts** - some vim keys conflict (Ctrl+R, etc.)
3. **Complexity creep** - easy to keep adding "just one more feature"
4. **Testing** - many edge cases with cursor positions

### Recommendation

Start with Phase 1 only. Get basic hjkl navigation + mode switching working well before adding editing commands. This covers 80% of the vim appeal (efficient navigation) with 20% of the complexity.

---

## Other Ideas

### Day/Night Cycle
- Track total words written or use system time
- Gradually shift sky colors
- Stars appear at night, sun/clouds more prominent during day

### Achievements/Milestones
- First 100 words: "Getting Started"
- First 1000 words: "Finding Your Stride"
- 10,000 words: "Marathon Writer"
- Visual celebration for each

### Terrain Variety
- Different "biomes" as you write more
- Forest → Mountains → Desert → Ocean → Space?
- Each with unique scenery objects

### Sound Effects (Optional)
- Soft footstep sounds matching animation
- Whoosh on jump
- Gentle ambient background
- Master toggle to disable

### Export Options
- Download as .txt or .md
- Word count and "distance traveled" stats
- Optional: generate an image of your runner at current position

### Multiplayer/Social
- See ghosts of other writers' runners?
- Compare word counts on leaderboard?
- (probably overkill for a zen writing tool)
