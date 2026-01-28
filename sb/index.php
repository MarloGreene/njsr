<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PHP Dynamic Soundboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .sound-button {
      display: inline-block;
      margin: 10px;
      padding: 20px;
      font-size: 1.2em;
      color: white;
      background-color: #007BFF;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .sound-button:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <h1>Dynamic Soundboard</h1>
  <div id="buttons">
    <?php
      $soundDir = './sounds'; // Path to the sounds directory
      $files = scandir($soundDir); // Get all files in the directory

      foreach ($files as $file) {
        // Check for valid sound file extensions
        if (preg_match('/\.(mp3|wav)$/i', $file)) {
          // Remove the file extension for the button label
          $label = pathinfo($file, PATHINFO_FILENAME);
          echo "<button class='sound-button' data-file='$soundDir/$file'>$label</button>";
        }
      }
    ?>
  </div>

  <script>
    let currentAudio = null; // Variable to keep track of the currently playing audio

    // Add event listeners to all sound buttons
    document.querySelectorAll('.sound-button').forEach(button => {
      button.addEventListener('click', () => {
        const file = button.getAttribute('data-file');

        // If the sound is already playing, stop it
        if (currentAudio && currentAudio.src.includes(file)) {
          currentAudio.pause();
          currentAudio.currentTime = 0; // Reset the sound to the start
          currentAudio = null; // Clear the currentAudio variable
        } else {
          // Otherwise, play the new sound
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0; // Stop the previous sound
          }
          currentAudio = new Audio(file); // Create a new audio object
          currentAudio.play();
        }
      });
    });
  </script>

  <footer style="margin-top:2rem;padding:1rem;text-align:center;font-size:0.85rem;color:#666;">
    <p style="margin:0 0 0.5rem;"><strong>Dynamic Soundboard</strong> &middot; /sb/</p>
    <p style="margin:0 0 0.5rem;">Click to play, click again to stop.</p>
    <p style="margin:0;opacity:0.7;">MIT License &copy; njsr.org 2002-2026</p>
  </footer>
</body>
</html>

