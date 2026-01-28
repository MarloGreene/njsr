// 23 Questions Scripture Viewer - Inline Expandable Implementation
document.addEventListener('DOMContentLoaded', function() {
    let scripturesData = {};
    let isLoading = true;

    // Display verse references for each question
    displayVerseReferences();

    // Handle URL hash navigation (permalinks)
    handlePermalinkNavigation();

    // Load scriptures data
    loadScriptures();

    // Handle question clicks to expand/collapse
    document.addEventListener('click', function(e) {
        const li = e.target.closest('li');
        if (li && li.hasAttribute('data-refs')) {
            e.preventDefault();
            toggleQuestion(li);
        }
    });

    // Handle permalink button clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('permalink-btn')) {
            e.preventDefault();
            e.stopPropagation(); // Prevent triggering the question expansion
            copyPermalink(e.target);
        }
    });

    // Handle expand/collapse all button
    const expandCollapseBtn = document.getElementById('expand-collapse-all');
    if (expandCollapseBtn) {
        expandCollapseBtn.addEventListener('click', function() {
            toggleAllQuestions();
        });
    }

    function handlePermalinkNavigation() {
        const hash = window.location.hash;
        if (hash) {
            // Support both #3 and #q3 formats
            const match = hash.match(/^#(q)?(\d+)$/);
            if (match) {
                const questionNumber = parseInt(match[2]);
                const questionId = `q${questionNumber}`;
                const questionElement = document.getElementById(questionId);
                
                if (questionElement) {
                    // Scroll to the question
                    questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Expand the question after a short delay to ensure scrolling is complete
                    setTimeout(() => {
                        toggleQuestion(questionElement);
                    }, 500);
                }
            }
        }
    }

    function copyPermalink(button) {
        const questionNumber = button.getAttribute('data-question');
        const currentUrl = window.location.origin + window.location.pathname;
        const permalinkUrl = `${currentUrl}#${questionNumber}`;

        // Copy to clipboard
        navigator.clipboard.writeText(permalinkUrl).then(function() {
            // Show success feedback
            button.classList.add('copied');
            button.textContent = '✅';

            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('copied');
                button.textContent = '🔗';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy permalink: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = permalinkUrl;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                button.classList.add('copied');
                button.textContent = '✅';
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.textContent = '🔗';
                }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed: ', fallbackErr);
            }
            document.body.removeChild(textArea);
        });
    }

    async function loadScriptures() {
        try {
            console.log('Loading scriptures...');
            const response = await fetch('quad.txt');
            const text = await response.text();

            // Parse the quad.txt file
            const lines = text.split('\n');
            scripturesData = {};
            let verseCount = 0;

            lines.forEach(line => {
                if (line.trim()) {
                    // Split on exactly 5 spaces (the delimiter pattern in quad.txt)
                    const parts = line.split(/\s{5}/);
                    if (parts.length >= 2) {
                        const reference = parts[0].trim();
                        const text = parts[1].trim();

                        // Parse reference like "2 Nephi 29:1" or "Genesis 1:1"
                        const refParts = reference.split(/\s+/);
                        if (refParts.length >= 2) {
                            const lastPart = refParts[refParts.length - 1];
                            const chapterVerseMatch = lastPart.match(/^(\d+):(\d+)$/);
                            if (chapterVerseMatch) {
                                const [, chapter, verse] = chapterVerseMatch;
                                const book = refParts.slice(0, -1).join(' ');
                                const bookKey = book.toLowerCase().replace(/\s+/g, '-');

                                if (!scripturesData[bookKey]) {
                                    scripturesData[bookKey] = {};
                                }
                                if (!scripturesData[bookKey][chapter]) {
                                    scripturesData[bookKey][chapter] = {};
                                }

                                scripturesData[bookKey][chapter][verse] = {
                                    text: text,
                                    reference: reference
                                };
                                verseCount++;
                            }
                        }
                    }
                }
            });

            isLoading = false;
            console.log('Scriptures loaded successfully -', Object.keys(scripturesData).length, 'books,', verseCount, 'verses');

        } catch (error) {
            console.error('Error loading scriptures:', error);
            isLoading = false; // Ensure loading flag is cleared even on error
        }
    }

    function displayVerseReferences() {
        const questions = document.querySelectorAll('li[data-refs]');
        questions.forEach(li => {
            const refs = li.getAttribute('data-refs').split(',');
            const formattedRefs = refs.map(ref => {
                const parts = ref.trim().split('.');
                if (parts.length === 3) {
                    const [book, chapter, verses] = parts;
                    return `${book} ${chapter}:${verses}`;
                }
                return ref.trim();
            });

            // Get the question text (everything before the scripture-content div)
            const scriptureContent = li.querySelector('.scripture-content');
            let questionText = '';
            const textNodes = [];

            // Collect all text nodes
            for (let node = li.firstChild; node && node !== scriptureContent; node = node.nextSibling) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    questionText += node.textContent.trim() + ' ';
                    textNodes.push(node);
                }
            }

            questionText = questionText.trim();

            // Create question text span
            const questionSpan = document.createElement('span');
            questionSpan.className = 'question-text';
            
            // Create text container
            const textContainer = document.createElement('span');
            textContainer.className = 'question-text-content';
            textContainer.textContent = questionText;
            
            // Find and move the permalink button
            const permalinkBtn = li.querySelector('.permalink-btn');
            
            // Create verse references span
            const refSpan = document.createElement('span');
            refSpan.className = 'verse-references';
            refSpan.textContent = formattedRefs.join('; ');
            
            // Add text, references, and button to question span
            questionSpan.appendChild(textContainer);
            questionSpan.appendChild(refSpan);
            if (permalinkBtn) {
                questionSpan.appendChild(permalinkBtn);
            }

            // Replace text nodes with structured elements
            textNodes.forEach(node => li.removeChild(node));

            // Add the question span before scripture content
            li.insertBefore(questionSpan, scriptureContent);
        });
    }

    function toggleQuestion(li) {
        const scriptureContent = li.querySelector('.scripture-content');
        const refs = li.getAttribute('data-refs').split(',');
        const questionId = li.id;
        const isExpanding = scriptureContent.style.display !== 'block';

        if (scriptureContent.style.display === 'block') {
            // Collapse
            scriptureContent.style.display = 'none';
        } else {
            // Expand and load scriptures
            if (scriptureContent.innerHTML.trim() === '') {
                // Load scriptures for the first time
                loadScripturesForQuestion(scriptureContent, refs);
            }
            scriptureContent.style.display = 'block';
        }

        // Update URL hash for permalink
        if (isExpanding && questionId) {
            // Extract question number from id (e.g., "q3" -> "3")
            const questionNumber = questionId.replace('q', '');
            window.history.replaceState(null, null, `#${questionNumber}`);
        } else if (!isExpanding) {
            // Remove hash when collapsing
            window.history.replaceState(null, null, window.location.pathname);
        }
    }

    function toggleAllQuestions() {
        const btn = document.getElementById('expand-collapse-all');
        const allScriptureContents = document.querySelectorAll('.scripture-content');
        const isExpanding = btn.textContent === 'Expand All';
        
        allScriptureContents.forEach(content => {
            if (isExpanding) {
                // Expand all
                if (content.innerHTML.trim() === '') {
                    // Load scriptures if not already loaded
                    const li = content.closest('li');
                    const refs = li.getAttribute('data-refs').split(',');
                    loadScripturesForQuestion(content, refs);
                }
                content.style.display = 'block';
            } else {
                // Collapse all
                content.style.display = 'none';
            }
        });
        
        // Update button text
        btn.textContent = isExpanding ? 'Collapse All' : 'Expand All';
        
        // Clear URL hash when collapsing all
        if (!isExpanding) {
            window.history.replaceState(null, null, window.location.pathname);
        }
    }

    function loadScripturesForQuestion(container, refs) {
        if (isLoading) {
            container.innerHTML = '<div class="loading">Loading scriptures... Please wait a moment and try again.</div>';
            return;
        }

        let html = '';

        refs.forEach(ref => {
            const refParts = ref.trim().split('.');
            if (refParts.length === 3) {
                const [book, chapter, verses] = refParts;
                const bookName = convertBookCode(book);
                const chapterNum = chapter;
                const verseRange = verses || null;
                html += displayScripturesInline(bookName, chapterNum, verseRange);
            }
        });

        container.innerHTML = html;
    }

    function extractReference(href) {
        // Extract reference from URL like "https://www.churchofjesuschrist.org/study/scriptures/bofm/2-ne/29.1-11?lang=eng"
        const urlMatch = href.match(/\/study\/scriptures\/([^\/]+)\/([^\/]+)\/([^.?]+)/);
        if (!urlMatch) return null;

        const [, testament, book, chapterAndVerses] = urlMatch;

        // Handle different testament prefixes
        let bookName = book;
        if (testament === 'bofm') {
            // Convert URL format to readable format
            bookName = convertBookCode(book);
        } else if (testament === 'nt') {
            bookName = convertNewTestamentCode(book);
        } else if (testament === 'ot') {
            bookName = convertOldTestamentCode(book);
        }

        // Parse chapter and verses (e.g., "29.1-11" -> chapter 29, verses 1-11)
        const chapterVerseMatch = chapterAndVerses.match(/^(\d+)(?:\.(\d+(?:-\d+)?))?$/);
        if (!chapterVerseMatch) return null;

        const [, chapter, verses] = chapterVerseMatch;

        return {
            book: bookName,
            chapter: chapter,
            verses: verses || null // null means whole chapter
        };
    }

    function convertBookCode(code) {
        const bookMap = {
            '1-ne': '1 Nephi',
            '2-ne': '2 Nephi',
            'jacob': 'Jacob',
            'enos': 'Enos',
            'jarom': 'Jarom',
            'omni': 'Omni',
            'w-of-m': 'Words of Mormon',
            'mosiah': 'Mosiah',
            'alma': 'Alma',
            'hel': 'Helaman',
            '3-ne': '3 Nephi',
            '4-ne': '4 Nephi',
            'mormon': 'Mormon',
            'ether': 'Ether',
            'moro': 'Moroni'
        };
        return bookMap[code] || code;
    }

    function convertNewTestamentCode(code) {
        const bookMap = {
            'matt': 'Matthew',
            'mark': 'Mark',
            'luke': 'Luke',
            'john': 'John',
            'acts': 'Acts',
            'rom': 'Romans',
            '1-cor': '1 Corinthians',
            '2-cor': '2 Corinthians',
            'gal': 'Galatians',
            'eph': 'Ephesians',
            'philip': 'Philippians',
            'col': 'Colossians',
            '1-thes': '1 Thessalonians',
            '2-thes': '2 Thessalonians',
            '1-tim': '1 Timothy',
            '2-tim': '2 Timothy',
            'titus': 'Titus',
            'philem': 'Philemon',
            'heb': 'Hebrews',
            'james': 'James',
            '1-pet': '1 Peter',
            '2-pet': '2 Peter',
            '1-jn': '1 John',
            '2-jn': '2 John',
            '3-jn': '3 John',
            'jude': 'Jude',
            'rev': 'Revelation'
        };
        return bookMap[code] || code;
    }

    function convertOldTestamentCode(code) {
        const bookMap = {
            'gen': 'Genesis',
            'ex': 'Exodus',
            'lev': 'Leviticus',
            'num': 'Numbers',
            'deut': 'Deuteronomy',
            'josh': 'Joshua',
            'judg': 'Judges',
            'ruth': 'Ruth',
            '1-sam': '1 Samuel',
            '2-sam': '2 Samuel',
            '1-kgs': '1 Kings',
            '2-kgs': '2 Kings',
            '1-chr': '1 Chronicles',
            '2-chr': '2 Chronicles',
            'ezra': 'Ezra',
            'neh': 'Nehemiah',
            'esth': 'Esther',
            'job': 'Job',
            'ps': 'Psalms',
            'prov': 'Proverbs',
            'eccl': 'Ecclesiastes',
            'song': 'Song of Solomon',
            'isa': 'Isaiah',
            'jer': 'Jeremiah',
            'lam': 'Lamentations',
            'ezek': 'Ezekiel',
            'dan': 'Daniel',
            'hosea': 'Hosea',
            'joel': 'Joel',
            'amos': 'Amos',
            'obad': 'Obadiah',
            'jonah': 'Jonah',
            'micah': 'Micah',
            'nahum': 'Nahum',
            'hab': 'Habakkuk',
            'zeph': 'Zephaniah',
            'hag': 'Haggai',
            'zech': 'Zechariah',
            'mal': 'Malachi'
        };
        return bookMap[code] || code;
    }

    function displayScripturesInline(bookName, chapter, verseRange) {
        const bookKey = bookName.toLowerCase().replace(/\s+/g, '-');

        if (!scripturesData[bookKey] || !scripturesData[bookKey][chapter]) {
            return `<div class="scripture-error">Scripture not found: ${bookName} ${chapter}</div>`;
        }

        const chapterData = scripturesData[bookKey][chapter];
        const allVerses = Object.keys(chapterData).map(v => parseInt(v)).sort((a, b) => a - b);

        // For inline display, show only the referenced verses (no full chapter toggle)
        let versesToShow = [];
        let highlightedVerses = [];

        if (verseRange) {
            // Parse verse range like "1-11" or "25"
            if (verseRange.includes('-')) {
                const [start, end] = verseRange.split('-').map(v => parseInt(v));
                highlightedVerses = allVerses.filter(v => v >= start && v <= end);
            } else {
                highlightedVerses = [parseInt(verseRange)];
            }
            versesToShow = highlightedVerses;
        } else {
            // No specific verses - show all verses in chapter
            versesToShow = allVerses;
            highlightedVerses = allVerses;
        }

        // Build HTML
        let html = `<div class="scripture-reference">${bookName} ${chapter}`;
        if (verseRange) {
            html += `:${verseRange}`;
        }
        html += '</div>';

        versesToShow.forEach(verseNum => {
            const verseData = chapterData[verseNum.toString()];
            if (verseData) {
                const isHighlighted = highlightedVerses.includes(verseNum);
                const highlightClass = isHighlighted ? 'verse-highlighted' : '';

                html += `
                    <div class="scripture-verse ${highlightClass}">
                        <span class="verse-number">${verseNum}</span>
                        <span class="verse-text">${verseData.text}</span>
                    </div>
                `;
            }
        });

        return html;
    }

});