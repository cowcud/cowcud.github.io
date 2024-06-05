let countdown;
let remainingTime;

function loadImage () {
    var iframeDiv = document.getElementById("imageFrame");
    var iframeHeight = iframeDiv.offsetHeight;
    const imgUrl = `https://random.imagecdn.app/${iframeHeight}/${iframeHeight}`;
    document.getElementById('imageFrame').src = imgUrl;
};

function startTimer(minutes) {
    remainingTime = minutes * 60;
    document.getElementById('durationButtons').style.display = 'none';
    document.getElementById('timer').style.display = 'block';
    updateTimerDisplay();
    countdown = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (remainingTime <= 0) {
      clearInterval(countdown);
      playBeep();
      resetTimer();
      return;
    }
    remainingTime--;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById('timer').innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(countdown);
    resetTimer();
}

function resetTimer() {
    document.getElementById('timer').style.display = 'none';
    document.getElementById('durationButtons').style.display = 'block';
}

function playBeep() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5); // Beep for 0.5 seconds
}

document.getElementById('reloadButton').addEventListener('click', function() {
    loadImage();
    stopTimer();  // Stop the countdown if it's running
    resetTimer(); // Reset to show duration buttons
});