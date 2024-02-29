//#region Preparation

// Get HTML elements for accessing in code
const buttonsContainer = document.getElementById("buttons-container");
const voiceContainer = document.getElementById("voice-container");
const textbox = document.getElementById("textbox");
const micButtonSpan = document.getElementById("mic-button-span");
const micButton = document.getElementById("mic-button");
const voiceDropdown = document.getElementById("voice-dropdown");
const selectedVoiceSpan = document.getElementById("selected-voice");
const voiceList = document.getElementById("voice-list");
const voiceFilter = document.getElementById("voice-filter");
const voiceListContent = document.getElementById("voice-list-content");
const speedSlider = document.getElementById("speed-slider");
const speedDisplay = document.getElementById("speed-display");

// Get speech synthesizer and speech recognition
let speechSynthesis = (window.speechSynthesis) ? window.speechSynthesis : null;
let speechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;
let speechRecognizing = false;

// Enable text input if speech synthesis is available
if (speechSynthesis) {
  buttonsContainer.style.display = "block";
  voiceContainer.style.display = "block";
} else {
  textbox.disabled = true;
  textbox.value = "I'm sorry, your browser does not support text-to-speech."
  micButtonSpan.style.display = "none";
  console.error("Speech Synthesis API not supported");
}

// Enable the mic button if speech recognition is available
if (speechRecognition) {
  //TBD - micButtonSpan.style.display = "block"; // Turn on the microphone icon if the browser supports speech recognition
  speechRecognition.interimResults = true; // Enable interim results for display
} else {
  console.error("Speech Recognition API not supported");
}

//#endregion

//#region Voice list generation and handling

let availableVoices = [];

// Get list of available voices provided by the speech synthesizer
function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  console.log(`Found ${availableVoices.length} voices`);
  populateVoicesDropdown(availableVoices);
};

speechSynthesis.onvoiceschanged = loadVoices; // Fix for issue where voices don't always load on page load

/*
  Populate the voices dropdown with the (possibly filtered) voice list
*/
function populateVoicesDropdown(voices) {
  // 
  const currentVoice = getCurrentVoice();
  selectedVoiceSpan.textContent = buildVoiceName(currentVoice);

  // Clear the existing voice list
  voiceListContent.innerHTML = "";

  // Generate a new voice list
  voices.forEach((voice) => {
    const voiceDiv = document.createElement("div");
    if (buildVoiceName(voice) == buildVoiceName(currentVoice)) {
      voiceDiv.className = "voice-list-selected";
    }
    voiceDiv.textContent = buildVoiceName(voice);
    voiceDiv.dataset.value = buildVoiceName(voice);
    voiceDiv.addEventListener("click", () => {
      selectVoice(voiceDiv); // Let user select a voice (Desktop)
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
  Toggle showing/hiding the voice list drop down
*/
function toggleVoiceList() {
  voiceList.style.display = voiceList.style.display === "block" ? "none" : "block";
  if (voiceList.style.display === "block") {
    filterVoices(); // Filter the list with previous filter value (if any)
  }
}

/*
  Get user search term from the input box and filter the full voice list on it
*/
function filterVoices() {
  const searchTerm = voiceFilter.value.toLowerCase();
  const filteredVoices = availableVoices.filter((voice) =>
    buildVoiceName(voice).toLowerCase().includes(searchTerm)
  );
  populateVoicesDropdown(filteredVoices);
}

/*
  Utility function to get current stored voice
*/
function getCurrentVoice() {
  // Use first available voice by default
  const firstVoice = (availableVoices[0] || {});

  // If the user chose a voice before, use that instead
  const selectedVoice = localStorage.getItem("selectedVoice");
  return selectedVoice && selectedVoice.name ? JSON.parse(selectedVoice) : firstVoice;
}

/* 
  Utility function for building a display name for a voice
*/
function buildVoiceName(voice) {
  return `${voice.name} (${voice.lang})`
}

/*
  Utility function to get the Speech Synthesis voice associated with a voice name
*/
function getVoice(voiceName) {
  let matchingVoice = {};

  // Extract voice name (e.g. "Microsoft George English (United Kingdom)"
  // and language code (e.g. "en-GB")
  const match = voiceName.match(/(.*)\s*\((.*)\)/);

  // Try and find a list of voices matching those parameters
  if (match) {
    matchingVoice = availableVoices.find(
      (voice) => voice.name == match[1].trim() && voice.lang == match[2].trim()
    );
  }

  return matchingVoice || {};
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
  const newVoice = getVoice(selectedVoiceDiv.textContent);
  selectedVoiceSpan.textContent = buildVoiceName(newVoice);

  // Store selected voice for future use
  localStorage.setItem("selectedVoice", JSON.stringify(newVoice));

  // Hide pop-up
  toggleVoiceList();

  // Restart Speech
  startSpeaking();
}
//#endregion

//#region Text-to-Speech

/*
  Speak the text in the textbox
*/
function startSpeaking() {
  // Stop any currently playing audio
  stopSpeaking();

  // Create a new utterance for the speech synthesizer
  const utterance = new SpeechSynthesisUtterance();

  // Get user selected text (if any) or just use the textbox contents for the utterance
  const selectedText = getSelectedText() || textbox.value;
  utterance.text = selectedText;

  const currentVoice = getVoice(selectedVoiceSpan.textContent);

  // Use the selected voice for the utterance
  const matchingVoice = availableVoices.find(
    (voice) => buildVoiceName(voice) === buildVoiceName(currentVoice)
  );

  utterance.voice = matchingVoice;
  utterance.lang = utterance.voice.lang; // Ensure lang set so works on Android

  // Set the utterance playback rate based on slider value
  utterance.rate = speedSlider.value;

  // Speak the utterance
  speechSynthesis.speak(utterance);

  // Update the speed slider display
  updateSpeedDisplay();
}

// Stop speaking
function stopSpeaking() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
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

//#endregion

//#region Speed control handling

/*
  Calculate and display the current speed percentage
*/
function updateSpeedDisplay() {
  const speed = speedSlider.value * 100;
  speedDisplay.textContent = `${speed.toFixed(1)}%`;
}

//#endregion

//#region Event Handlers - Speech Synthesis

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
  if (selectedText) { startSpeaking() }
}

/*
  Event handler called when user pastes new text into the text box
*/
function handleTextPasteChange(event) {
  window.setTimeout(startSpeaking,1)
}

/*
  Event handler called when user changes the playback speed slider position
*/
function handleSpeedSliderChange() {
  // Store selected speed for future use
  localStorage.setItem("selectedSpeed", speedSlider.value);

  // Refresh the speed display
  updateSpeedDisplay();

  // Restart speaking with the new speed
  startSpeaking();
}

//#endregion

//#region Event Listeners - Speech Synthesis

// Event listener for voice dropdown click
voiceDropdown.addEventListener("click", handleVoiceDropdownToggle);

// Event listener for voice filter input
voiceFilter.addEventListener("keyup", (event) => { handleVoiceFilterKey(event) });

// Event listener for text selection change - Note: This is attached to document because
// it does not fire when attached to the textbox directly
document.addEventListener("selectionchange", (event) => { handleTextSelectionChange(event) });

// Event listener for when paste new text into text area
textbox.onpaste = handleTextPasteChange;

// Event listener for speed slider change
speedSlider.addEventListener("change", handleSpeedSliderChange);

//#endregion

//#region Event Handlers - Speech Recognition
function handleClickMicButton() {
  console.log('handleClickMicButton')
  if (speechRecognition) {
    if (!speechRecognizing) {
      console.log('Starting with ',getCurrentVoice().lang)
      speechRecognition.lang = getCurrentVoice().lang;
      speechRecognition.start();
    } else {
      speechRecognition.stop();
    }
    speechRecognizing = !speechRecognizing;
  }
}

function handleSpeechRecognitionStarted() {
  console.log('handleSpeechRecognitionStarted')
  micButton.classList.add("active"); // Visually indicate recording
}

function handleSpeechRecognitionStopped() {
  console.log('handleSpeechRecognitionStopped')
  micButton.classList.remove("active");
}

function handleSpeechRecognitionCapture(event) {
  console.log('handleSpeechRecognitionCapture')
  let transcript = "";
  for (const result of event.results) {
    console.log('result',result)
    transcript += result[0].transcript;
  }
  textbox.value = transcript;
  console.log('final',transcript)
}

//#endregion

//region Event Listeners - Speech Recognition

/*
  Event listener for the clicking the mic button
*/
micButton.addEventListener("click", () => {
  handleClickMicButton()
});

/*
  Event listener for when speech recognition recording starts
*/
if (speechRecognition) {
  speechRecognition.onstart = handleSpeechRecognitionStarted;
  speechRecognition.onend = handleSpeechRecognitionStopped;
  speechRecognition.onresult = handleSpeechRecognitionCapture;
}

//#endregion

//#region Main

// On page load, get user saved preferences (if any) and use them to build the page
window.onload = () => {
  // Load voice list
  loadVoices();

  // Update default selected voice and 
  populateVoicesDropdown(availableVoices);
  // Set playback speed slider position
  updateSpeedDisplay();
};

//#endregion