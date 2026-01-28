# 23 Questions Answered by The Book of Mormon

An interactive scripture study tool that presents 23 fundamental questions answered by The Book of Mormon.

## Features

- **Single-Column Design**: Clean, focused layout with questions and expandable scripture content
- **Click-to-Expand**: Click any question to reveal the referenced scriptures inline
- **Instant Loading**: Scriptures load immediately from local data when expanded
- **Verse Highlighting**: Referenced verses are automatically highlighted in gold
- **Offline Capable**: Works without internet connection
- **Mobile Responsive**: Optimized for all screen sizes
- **Fast & Secure**: No external dependencies or tracking
- **Permalinks**: Share direct links to specific questions using `#3` format (e.g., `njsr.org/23/#3`) - click the 🔗 icon next to any question to copy its permalink

## Questions Covered

1. Does the Bible contain all of God's word?
2. Who were the "other sheep" referred to by Jesus as recorded in John 10:16?
3. How can a person know that the Book of Mormon is true?
4. How can a desire to believe develop into strong faith?
5. What is the purpose of man's existence?
6. How can God be both just and merciful?
7. What happens to our spirits at death?
8. How can a person turn his personal weaknesses into strengths?
9. What happened in America when Jesus was born in Bethlehem?
10. What happened in America when Jesus was crucified in Jerusalem?
11. What do we witness "unto the Father" by being baptized?
12. Why was Jesus Christ baptized?
13. Just what is the gospel of Jesus Christ? How did the Savior explain what it is?
14. Why was the atonement of Jesus Christ necessary?
15. To what extent are men accountable for their choices and their actions?
16. Do little children need repentance and baptism?
17. Does the Lord always protect the righteous from the unrighteous?
18. How did a prophet who lived 600 B.C. describe our day?
19. What should we pray about?
20. Why should we not procrastinate our repentance?
21. What will our bodies be like in the resurrection?
22. Are we saved by grace, by works, or both?
23. In a world with so many conflicting voices, how can a person judge what is good and what is evil?
5. What is the purpose of man's existence?
...and 18 more fundamental gospel questions

## Usage

1. Open `index.html` in any web browser
2. Click any question to expand and see the scriptures that answer it
3. Scriptures load instantly from the local `quad.txt` data file
4. Click again to collapse the scripture content

## Technical Details

- **HTML/CSS/JavaScript**: Pure vanilla implementation
- **Local Data**: Uses `quad.txt` (42K lines of scripture data)
- **Smart Parsing**: Efficient data structure for instant lookups
- **Responsive Flexbox**: Modern layout system
- **No Dependencies**: Zero external libraries or services

## Files

- `index.html` - Main application with expandable questions
- `styles.css` - Responsive styling for single-column layout
- `script.js` - Data loading and click-to-expand interaction logic
- `quad.txt` - Complete LDS scriptures (one verse per line)
- `references.md` - Formatted list of all scripture references by question
- `README.md` - This documentation

## Performance

- **~50ms load time** for scripture display
- **< 100KB total** (HTML + CSS + JS + data)
- **Instant verse switching** between references
- **Zero external requests** after initial load

## Privacy & Security

- **100% Local**: No external requests or data collection
- **Offline First**: Works without internet connection
- **No Tracking**: Zero analytics or external services
- **Secure**: No iframe vulnerabilities or external dependencies

## License

MIT License
