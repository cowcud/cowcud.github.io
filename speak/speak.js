// Get HTML elements for accessing in code
const textbox = document.getElementById("textbox");
const voiceList = document.getElementById("voice-list");
const voiceFilter = document.getElementById("voice-filter");
const voiceDropdown = document.getElementById("voice-dropdown");
const selectedVoiceSpan = document.getElementById("selected-voice");
const voiceListContent = document.getElementById("voice-list-content");
const speedSlider = document.getElementById("speed-slider");
const speedDisplay = document.getElementById("speed-display");

// Get speech synthesizer for browser and initialize voice list
const speechSynthesis = window.speechSynthesis;
let availableVoices = [];

// Get list of available voices provided by the speech synthesizer
function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  console.log(`Found ${availableVoices.length} voices`);
  populateVoicesDropdown(availableVoices);
};

speechSynthesis.onvoiceschanged = loadVoices; // Fix for issue where voices don't always load on page load

/*
  Toggle showing/hiding the voice list drop down
*/
function toggleVoiceList() {
  voiceList.style.display = voiceList.style.display === "block" ? "none" : "block";
  if (voiceList.style.display === "block") {
    voiceFilter.focus(); // Focus the input when the list is opened
    filterVoices(); // Filter the list with previous filter value (if any)
  }
}

/*
  Get user search term from the input box and filter the full voice list on it
*/
function filterVoices() {
  const searchTerm = voiceFilter.value.toLowerCase();
  const filteredVoices = availableVoices.filter((voice) =>
    voice.name.toLowerCase().includes(searchTerm)
  );
  populateVoicesDropdown(filteredVoices);
}

/*
  Populate the voices dropdown with the (possibly filtered) voice list
*/
function populateVoicesDropdown(voices) {
  // Set default voice on first load (if user has a stored preference),
  // otherwise just default to first available voice
  const firstVoice = (availableVoices[0] || {}).name;
  const storedVoice = localStorage.getItem("selectedVoice") || firstVoice;
  if (storedVoice) {
    selectedVoiceSpan.textContent = storedVoice;
  }


  // Clear the existing voice list
  voiceListContent.innerHTML = "";

  // Generate a new voice list
  voices.forEach((voice) => {
    const voiceDiv = document.createElement("div");
    if (voice.name == storedVoice) {
      voiceDiv.className = "voice-list-selected";
    }
    voiceDiv.textContent = `${voice.name}`;
    voiceDiv.dataset.value = voice.name;
    voiceDiv.addEventListener("click", () => {
      selectVoice(voiceDiv); // Let user select a voice (Desktop)
    });
    voiceDiv.addEventListener("touchstart", () => {
      selectVoice(voiceDiv); // Let user select a voice (Mobile)
    });
    
    voiceListContent.appendChild(voiceDiv);
  });

  // If the user previously selected a playback speed, default to that
  const storedSpeed = localStorage.getItem("selectedSpeed");
  if (storedSpeed) {
    speedSlider.value = storedSpeed;
  }
}

/*
  Change current voice when user selects a voice from the dropdown,
  either by clicking it or hitting Enter when scrolling the list of voices
*/
function selectVoice(selectedVoiceDiv) {
  // Remove "selected" class from previously selected voice
  const previouslySelected = voiceListContent.querySelector(".selected");
  if (previouslySelected) {
    previouslySelected.classList.remove("selected");
  }

  // Add "selected" class to the newly selected voice
  selectedVoiceDiv.classList.add("selected");

  // Update selected voice text
  selectedVoiceSpan.textContent = selectedVoiceDiv.textContent;

  // Store selected voice for future use
  localStorage.setItem("selectedVoice", selectedVoiceSpan.textContent);

  // Hide pop-up
  toggleVoiceList();

  // Restart Speech
  speak();
}

/*
  Speak the text in the textbox
*/
function speak() {
  // Stop any currently playing audio
  stop();

  // Create a new utterance for the speech synthesizer
  const utterance = new SpeechSynthesisUtterance();

  // Get user selected text (if any) or just use the textbox contents for the utterance
  const selectedText = getSelectedText() || textbox.value;
  utterance.text = selectedText;

  // Use the selected voice for the utterance
  utterance.voice = availableVoices.find(
    (voice) => voice.name === selectedVoiceSpan.textContent
  );

  // Set the utterance playback rate based on slider value
  utterance.rate = speedSlider.value;

  // Speak the utterance
  speechSynthesis.speak(utterance);

  // Store selected speed for future use
  localStorage.setItem("selectedSpeed", speedSlider.value);

  // Update the speed slider display
  updateSpeedDisplay();
}

/*
  Utility function to get the current selected text (if any)
*/
function getSelectedText() {
  const selectedTextStart = textbox.selectionStart;
  const selectedTextEnd = textbox.selectionEnd;
  const selectedText = (selectedTextStart !== selectedTextEnd) ? textbox.value.substring(selectedTextStart, selectedTextEnd) : null;
  return selectedText;
}

// Stop speaking
function stop() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

// Update speed display function
function updateSpeedDisplay() {
  const speed = speedSlider.value * 100; // Convert to percentage
  speedDisplay.textContent = `${speed.toFixed(1)}%`;
}

//////// EVENT HANDLERS ////////

/*
  Event handler called when the the user clicks to show or hide the voice dropdown
*/
function handleVoiceDropdownToggle() {
  toggleVoiceList();
}

/*
  Event handler called when the the user types in the filter box above the voice dropdown list
*/
function handleVoiceFilterKey(event) {
  if (event.key === "Enter") {
    const firstVoiceDiv = voiceListContent.querySelector("div");
    if (firstVoiceDiv) {
      selectVoice(firstVoiceDiv); // Select the first voice
    }
  } else {
    filterVoices(); // Filter voices as usual on other key presses
  }
}

/*
  Event handler called when the selected text changes so that we can speak
  just the selected text and not the whole text
*/
function handleTextSelectionChange(event) {
  // Only handle selection within the textbox
  // See: https://stackoverflow.com/questions/45757943/
  let elem = document.activeElement;
  let elemType = elem ? elem.tagName.toLowerCase() : 'none';
  if (elemType !== 'textarea') {
    return;
  }
  
  // Figure out which text is highlighted in the textbox
  const selectedText = getSelectedText();

  // If any text is selected, then just speak that text
  if (selectedText) { speak() }
}

/*
  Event handler called when user changes the playback speed slider position
*/
function handleSpeedSliderChange() {
  // Refresh the speed display
  updateSpeedDisplay();

  // Restart speaking with the new speed
  speak();
}

//////// EVENT LISTENERS ////////

// Event listener for voice dropdown click
voiceDropdown.addEventListener("click", handleVoiceDropdownToggle);

// Event listener for voice filter input
voiceFilter.addEventListener("keyup", (event) => { handleVoiceFilterKey(event) });

// Event listener for text selection change - Note: This is attached to document because
// it does not fire when attached to the textbox directly
document.addEventListener("selectionchange", (event) => { handleTextSelectionChange(event) });

// Event listener for speed slider change
speedSlider.addEventListener("change", handleSpeedSliderChange);


//////// MAIN ////////
// On page load, get user saved preferences (if any) and use them to build the page
window.onload = () => {
  // Load voice list
  loadVoices();

  // Update default selected voice and 
  populateVoicesDropdown(availableVoices);
  // Set playback speed slider position
  updateSpeedDisplay();
};