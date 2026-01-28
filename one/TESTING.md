# Ministering Memory Helper - Testing Checklist

## Core Functionality Tests

### 1. Add Family ✓
- [ ] Click "+ Add Someone New" button
- [ ] Fill in Family Name (required)
- [ ] Fill in optional fields (spouse, children, contact info)
- [ ] Fill in Last Contact Date
- [ ] Add notes in "What's Heavy" and "Next Nudge"
- [ ] Click Save
- [ ] Verify family appears in the list

### 2. Edit Family ✓
- [ ] Click the pencil/edit icon (✏️) on a family card
- [ ] Modify any field
- [ ] Click Save
- [ ] Verify changes appear on the card

### 3. Delete Family ✓
- [ ] Click the trash icon (🗑️) on a family card
- [ ] Confirm the deletion in the popup
- [ ] Verify family is removed from the list

### 4. Toggle Details (👁️) ✓
- [ ] Click the eye icon on a family card
- [ ] Verify full details expand (spouse, children, contact info)
- [ ] Click the eye icon again
- [ ] Verify details collapse
- [ ] Note: Icon should be slightly faded when details are hidden

### 5. Quick Contact ✓
- [ ] Click "✓ Mark Contacted Today" button on a card
- [ ] Verify last contact date updates to today
- [ ] Verify "days ago" counter resets to 0
- [ ] Verify toast notification appears
- [ ] Verify stats update automatically

### 6. Search Functionality ✓
- [ ] Type a family name in the search box
- [ ] Verify only matching families appear
- [ ] Verify scripture dividers are hidden during search
- [ ] Clear the search
- [ ] Verify all families and scriptures reappear

### 7. Stats Dashboard ✓
- [ ] Verify "Total Families" count is accurate
- [ ] Verify "Need Attention" shows families with 30+ days
- [ ] Verify "Contacted This Week" shows families within 7 days
- [ ] Add/edit/delete a family and verify stats update

### 8. Contact Links ✓
- [ ] Click a phone number - should open SMS app
- [ ] Click an email - should open email client
- [ ] Click an address - should open Google Maps in new tab

### 9. Export (JSON) ✓
- [ ] Click "📥 Export (JSON)" button
- [ ] Verify JSON file downloads
- [ ] Verify filename includes today's date
- [ ] Verify toast notification appears

### 10. Export (Text) ✓
- [ ] Click "📄 Export (Text)" button
- [ ] Verify .txt file downloads
- [ ] Open file and verify formatting is clean and readable
- [ ] Verify all family info is included
- [ ] Verify toast notification appears

### 11. Import Notes ✓
- [ ] Export your current data first (backup)
- [ ] Click "📤 Import Notes"
- [ ] Select a previously exported JSON file
- [ ] Confirm the replacement if you have existing data
- [ ] Verify all families load correctly
- [ ] Verify success alert appears

### 12. Scripture Rotation ✓
- [ ] Add 3+ families
- [ ] Verify a scripture verse appears between each family card
- [ ] Verify different scriptures are shown

### 13. Attention Highlighting ✓
- [ ] Find or create a family with last contact 30+ days ago
- [ ] Verify card has yellow background
- [ ] Verify "⏰ It's been X days..." badge appears

### 14. Empty State ✓
- [ ] Delete all families
- [ ] Verify friendly empty state message appears
- [ ] Verify stats and search bars are hidden

### 15. Modal Cancel/Close ✓
- [ ] Open the add/edit modal
- [ ] Click Cancel button - modal should close
- [ ] Open modal again
- [ ] Click the X button - modal should close
- [ ] Open modal again
- [ ] Click outside the modal - modal should close

### 16. Data Persistence ✓
- [ ] Add several families
- [ ] Refresh the page
- [ ] Verify all data is still there (localStorage)

## Mobile/Responsive Tests

### 17. Mobile View ✓
- [ ] Resize browser to mobile width (< 600px)
- [ ] Verify layout adapts properly
- [ ] Verify stats display in smaller format
- [ ] Verify import/export buttons stack vertically
- [ ] Verify cards are readable
- [ ] Verify modal fits on screen

## Edge Cases

### 18. Required Fields ✓
- [ ] Try to submit form without Family Name
- [ ] Verify error/validation prevents submission

### 19. Special Characters ✓
- [ ] Enter family name with special characters (O'Brien, José, etc.)
- [ ] Verify they display correctly
- [ ] Verify search finds them

### 20. Long Content ✓
- [ ] Enter very long text in "What's Heavy"
- [ ] Verify it displays without breaking layout
- [ ] Verify it exports correctly

## Known Fixes Applied
- ✅ Made toggle, edit, delete, and quickContact functions globally available
- ✅ Fixed toggle to check for both 'none' and empty string display values
- ✅ Added null checks to search and stats functions
- ✅ Added toast notifications for export confirmations

## Browser Testing Recommended
- [ ] Chrome/Edge
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
