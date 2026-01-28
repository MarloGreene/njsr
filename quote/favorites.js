// Curated favorite verses and quotes
// These get special weighting and can be browsed separately
// Format: { ref: "Reference as it appears in txt file", source: "Display source name" }

const FAVORITES = [
    // Bible (KJV) - Classic verses
    { ref: "Psalm 23:1", source: "Bible (KJV)" },
    { ref: "Psalm 23:4", source: "Bible (KJV)" },
    { ref: "Psalm 46:10", source: "Bible (KJV)" },
    { ref: "Proverbs 3:5", source: "Bible (KJV)" },
    { ref: "Proverbs 3:6", source: "Bible (KJV)" },
    { ref: "Proverbs 9:10", source: "Bible (KJV)" },
    { ref: "Proverbs 22:6", source: "Bible (KJV)" },
    { ref: "Ecclesiastes 3:1", source: "Bible (KJV)" },
    { ref: "Isaiah 40:31", source: "Bible (KJV)" },
    { ref: "Isaiah 41:10", source: "Bible (KJV)" },
    { ref: "Jeremiah 29:11", source: "Bible (KJV)" },
    { ref: "Matthew 5:14", source: "Bible (KJV)" },
    { ref: "Matthew 5:16", source: "Bible (KJV)" },
    { ref: "Matthew 6:33", source: "Bible (KJV)" },
    { ref: "Matthew 7:7", source: "Bible (KJV)" },
    { ref: "Matthew 11:28", source: "Bible (KJV)" },
    { ref: "Matthew 11:29", source: "Bible (KJV)" },
    { ref: "John 3:16", source: "Bible (KJV)" },
    { ref: "John 8:32", source: "Bible (KJV)" },
    { ref: "John 14:6", source: "Bible (KJV)" },
    { ref: "John 14:27", source: "Bible (KJV)" },
    { ref: "Romans 8:28", source: "Bible (KJV)" },
    { ref: "Romans 12:21", source: "Bible (KJV)" },
    { ref: "1 Corinthians 13:4", source: "Bible (KJV)" },
    { ref: "1 Corinthians 13:13", source: "Bible (KJV)" },
    { ref: "Galatians 5:22", source: "Bible (KJV)" },
    { ref: "Philippians 4:6", source: "Bible (KJV)" },
    { ref: "Philippians 4:13", source: "Bible (KJV)" },
    { ref: "Hebrews 11:1", source: "Bible (KJV)" },
    { ref: "James 1:5", source: "Bible (KJV)" },
    { ref: "1 John 4:8", source: "Bible (KJV)" },

    // Book of Mormon - Popular verses
    { ref: "1 Nephi 3:7", source: "Book of Mormon" },
    { ref: "2 Nephi 2:25", source: "Book of Mormon" },
    { ref: "2 Nephi 9:28", source: "Book of Mormon" },
    { ref: "2 Nephi 28:30", source: "Book of Mormon" },
    { ref: "2 Nephi 32:3", source: "Book of Mormon" },
    { ref: "Mosiah 2:17", source: "Book of Mormon" },
    { ref: "Mosiah 3:19", source: "Book of Mormon" },
    { ref: "Mosiah 4:27", source: "Book of Mormon" },
    { ref: "Alma 32:21", source: "Book of Mormon" },
    { ref: "Alma 37:6", source: "Book of Mormon" },
    { ref: "Alma 37:37", source: "Book of Mormon" },
    { ref: "Alma 41:10", source: "Book of Mormon" },
    { ref: "Helaman 5:12", source: "Book of Mormon" },
    { ref: "Ether 12:6", source: "Book of Mormon" },
    { ref: "Ether 12:27", source: "Book of Mormon" },
    { ref: "Moroni 7:45", source: "Book of Mormon" },
    { ref: "Moroni 10:4", source: "Book of Mormon" },
    { ref: "Moroni 10:5", source: "Book of Mormon" },

    // Doctrine and Covenants
    { ref: "D&C 1:37", source: "Doctrine and Covenants" },
    { ref: "D&C 4:2", source: "Doctrine and Covenants" },
    { ref: "D&C 6:36", source: "Doctrine and Covenants" },
    { ref: "D&C 18:10", source: "Doctrine and Covenants" },
    { ref: "D&C 19:23", source: "Doctrine and Covenants" },
    { ref: "D&C 58:27", source: "Doctrine and Covenants" },
    { ref: "D&C 64:10", source: "Doctrine and Covenants" },
    { ref: "D&C 82:10", source: "Doctrine and Covenants" },
    { ref: "D&C 88:118", source: "Doctrine and Covenants" },
    { ref: "D&C 121:7", source: "Doctrine and Covenants" },
    { ref: "D&C 121:8", source: "Doctrine and Covenants" },
    { ref: "D&C 130:20", source: "Doctrine and Covenants" },
    { ref: "D&C 130:21", source: "Doctrine and Covenants" },
];

// Additional standalone quotes (not from textfiles)
const STANDALONE_QUOTES = [
    // Founding documents / American history
    {
        text: "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.",
        ref: "Declaration of Independence",
        source: "U.S. Founding Documents",
        category: "founding"
    },
    {
        text: "Give me liberty, or give me death!",
        ref: "Patrick Henry, 1775",
        source: "American Revolution",
        category: "founding"
    },
    {
        text: "Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither Liberty nor Safety.",
        ref: "Benjamin Franklin, 1755",
        source: "Founders' Wisdom",
        category: "founding"
    },
    {
        text: "The tree of liberty must be refreshed from time to time with the blood of patriots and tyrants.",
        ref: "Thomas Jefferson, 1787",
        source: "Founders' Wisdom",
        category: "founding"
    },

    // Philosophy
    {
        text: "The unexamined life is not worth living.",
        ref: "Socrates",
        source: "Ancient Philosophy",
        category: "philosophy"
    },
    {
        text: "Waste no more time arguing about what a good man should be. Be one.",
        ref: "Marcus Aurelius",
        source: "Meditations",
        category: "philosophy"
    },
    {
        text: "You have power over your mind — not outside events. Realize this, and you will find strength.",
        ref: "Marcus Aurelius",
        source: "Meditations",
        category: "philosophy"
    },
    {
        text: "It is not death that a man should fear, but he should fear never beginning to live.",
        ref: "Marcus Aurelius",
        source: "Meditations",
        category: "philosophy"
    },
    {
        text: "No man is free who is not master of himself.",
        ref: "Epictetus",
        source: "Stoicism",
        category: "philosophy"
    },
    {
        text: "We suffer more often in imagination than in reality.",
        ref: "Seneca",
        source: "Stoicism",
        category: "philosophy"
    },
    {
        text: "Knowing yourself is the beginning of all wisdom.",
        ref: "Aristotle",
        source: "Ancient Philosophy",
        category: "philosophy"
    },

    // Literature
    {
        text: "To be, or not to be, that is the question.",
        ref: "Hamlet, Act 3 Scene 1",
        source: "Shakespeare",
        category: "literature"
    },
    {
        text: "All the world's a stage, and all the men and women merely players.",
        ref: "As You Like It, Act 2 Scene 7",
        source: "Shakespeare",
        category: "literature"
    },
    {
        text: "The fault, dear Brutus, is not in our stars, but in ourselves.",
        ref: "Julius Caesar, Act 1 Scene 2",
        source: "Shakespeare",
        category: "literature"
    },
    {
        text: "This above all: to thine own self be true.",
        ref: "Hamlet, Act 1 Scene 3",
        source: "Shakespeare",
        category: "literature"
    },
    {
        text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life.",
        ref: "Walden",
        source: "Henry David Thoreau",
        category: "literature"
    },
];
