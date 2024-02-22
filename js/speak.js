const textbox = document.getElementById("textbox");
const voiceList = document.getElementById("voice-list");
const voiceFilter = document.getElementById("voice-filter");
const voiceDropdown = document.getElementById("voice-dropdown");
const selectedVoiceSpan = document.getElementById("selected-voice");
const voiceListContent = document.getElementById("voice-list-content");
const speedSlider = document.getElementById("speed-slider");
const speedDisplay = document.getElementById("speed-display");
const speechSynthesis = window.speechSynthesis;

// Get available voices
let availableVoices = [];
speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
  populateVoicesDropdown(availableVoices);
};

function toggleVoiceList() {
  voiceList.style.display = voiceList.style.display === "block" ? "none" : "block";
  if (voiceList.style.display === "block") {
voiceFilter.focus(); // Focus the input when the list is opened
filterVoices(); // Filter with previous filter value (if any)
  }
}

function filterVoices() {
const searchTerm = voiceFilter.value.toLowerCase();
const filteredVoices = availableVoices.filter((voice) =>
voice.name.toLowerCase().includes(searchTerm) ||
voice.lang.toLowerCase().includes(searchTerm)
);
populateVoicesDropdown(filteredVoices);
}

// Populate voices dropdown
function populateVoicesDropdown(voices) {
  // Set default voice on first load (if stored preference)
  const firstVoice = (availableVoices[0]||{}).name;
  const storedVoice = localStorage.getItem("selectedVoice") || firstVoice;
  if (storedVoice) {
selectedVoiceSpan.textContent = storedVoice;
  }
  
  voiceListContent.innerHTML = ""; // Clear only the voice list content
  voices.forEach((voice) => {
  const voiceDiv = document.createElement("div");
  if(voice.name == storedVoice) {
voiceDiv.className = "voice-list-selected";
  }
  voiceDiv.textContent = `${voice.name}`;
  voiceDiv.dataset.value = voice.name;
  voiceDiv.addEventListener("click", () => {
  selectVoice(voiceDiv);
  });
  voiceListContent.appendChild(voiceDiv);
  });
  
  const storedSpeed = localStorage.getItem("selectedSpeed");
  if (storedSpeed) {
speedSlider.value = storedSpeed;
  }
}

function selectVoice(selectedVoiceDiv) {
  // Remove "selected" class from previously selected voice
  const previouslySelected = voiceListContent.querySelector(".selected");
  if (previouslySelected) {
previouslySelected.classList.remove("selected");
  }

  // Add "selected" class to the clicked voice
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

// Speak the text
function speak() {
  stop(); // Stop any currently playing audio

  const utterance = new SpeechSynthesisUtterance();
  
  const selectedText = getSelectedText() || textbox.value; // Get selected text (if any)
  utterance.text = selectedText;
  utterance.voice = availableVoices.find(
(voice) => voice.name === selectedVoiceSpan.textContent
  );
  
  utterance.rate = speedSlider.value; // Set playback rate based on slider value
  speechSynthesis.speak(utterance);
  
  // Store selected speed for future use
  localStorage.setItem("selectedSpeed", speedSlider.value);

  // Update speed display
  updateSpeedDisplay();
}

// Don't speak whole text when remove selection
function speakSelection() {
  const selectedText = getSelectedText();
  if (selectedText) { speak() }
}

// Get selected text function
function getSelectedText() {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
return selection.toString().trim();
  } else {
return null;
  }
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

// Add event listener for filtering
voiceFilter.addEventListener("input", filterVoices);

// Event listener for voice filter input
voiceFilter.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
const firstVoiceDiv = voiceListContent.querySelector("div");
if (firstVoiceDiv) {
  selectVoice(firstVoiceDiv); // Select the first voice
}
  } else {
filterVoices(); // Filter voices as usual on other key presses
  }
});

// Event listener for voice dropdown click
voiceDropdown.addEventListener("click", toggleVoiceList);

// Event listener for voice selection
voiceListContent.addEventListener("click", (event) => {
  const selectedVoice = event.target;
  selectedVoiceSpan.textContent = selectedVoice.textContent;
});

// Event listener for speed slider change
speedSlider.addEventListener("change", () => {
  updateSpeedDisplay();
  speak(); // Restart speaking with the new speed
});

// Event listener for text selection change
document.addEventListener("selectionchange", speakSelection);

// Load preferences on page load
window.onload = () => {
  populateVoicesDropdown(availableVoices);
  updateSpeedDisplay();
};