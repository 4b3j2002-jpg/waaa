const playButton = document.querySelector(".play-button");
const restartButton = document.querySelector(".restart-button");
const progress = document.querySelector(".progress");
const currentTimeLabel = document.querySelector(".current-time");
const waveform = document.querySelector(".waveform");
const audioNote = document.querySelector(".audio-note");
const trackDuration = 24;
const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 392, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392, 523.25, 587.33, 659.25, 783.99, 659.25, 523.25, 392];

let audioContext;
let isPlaying = false;
let playbackPosition = 0;
let startedAt = 0;
let playbackTimer;
let nextNoteIndex = 0;

function formatTime(seconds) {
    const wholeSeconds = Math.floor(seconds);
    return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function updateProgress() {
    progress.value = playbackPosition;
    progress.style.setProperty("--progress", `${(playbackPosition / trackDuration) * 100}%`);
    currentTimeLabel.textContent = formatTime(playbackPosition);
}

function setPlaying(playing) {
    isPlaying = playing;
    playButton.setAttribute("aria-pressed", String(playing));
    playButton.setAttribute("aria-label", playing ? "暫停新曲試聽" : "播放新曲試聽");
    waveform.classList.toggle("is-playing", playing);
}

function playTone(frequency, when, duration, volume) {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, when);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(audioContext.destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.03);
}

function playNote(index, when) {
    const frequency = notes[index % notes.length];
    playTone(frequency, when, 0.68, 0.12);
    playTone(frequency * 0.5, when, 0.82, 0.045);
    if (index % 4 === 0) {
        playTone(frequency * 1.5, when + 0.025, 0.5, 0.025);
    }
}

function stopPlayback() {
    if (playbackTimer) {
        window.clearInterval(playbackTimer);
        playbackTimer = undefined;
    }
    if (audioContext && audioContext.state === "running") {
        audioContext.suspend();
    }
    setPlaying(false);
}

function startPlayback() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            audioNote.textContent = "此瀏覽器不支援音訊播放，請改用最新版瀏覽器。";
            playButton.disabled = true;
            return;
        }
        audioContext = new AudioContextClass();
    }

    audioContext.resume().then(() => {
        if (playbackPosition >= trackDuration) {
            playbackPosition = 0;
        }
        startedAt = audioContext.currentTime - playbackPosition;
        setPlaying(true);

        nextNoteIndex = Math.floor(playbackPosition / 0.8);
        playbackTimer = window.setInterval(() => {
            playbackPosition = Math.min(audioContext.currentTime - startedAt, trackDuration);
            const currentNote = Math.floor(playbackPosition / 0.8);
            while (nextNoteIndex <= currentNote && nextNoteIndex < notes.length) {
                playNote(nextNoteIndex, audioContext.currentTime + 0.015);
                nextNoteIndex += 1;
            }
            updateProgress();
            if (playbackPosition >= trackDuration) {
                stopPlayback();
            }
        }, 50);
    }).catch((error) => {
        audioNote.textContent = `音訊無法啟動：${error.message}`;
    });
}

for (let index = 0; index < 52; index += 1) {
    const bar = document.createElement("span");
    const height = 5 + Math.round((Math.sin(index * 1.73) + 1) * 10);
    bar.style.height = `${height}px`;
    bar.style.setProperty("--delay", `${(index % 9) * -0.11}s`);
    waveform.append(bar);
}

playButton.addEventListener("click", () => {
    if (isPlaying) {
        playbackPosition = Math.min(audioContext.currentTime - startedAt, trackDuration);
        updateProgress();
        stopPlayback();
        return;
    }
    startPlayback();
});

restartButton.addEventListener("click", () => {
    playbackPosition = 0;
    updateProgress();
    if (isPlaying) {
        startedAt = audioContext.currentTime;
        nextNoteIndex = 0;
    }
});

progress.addEventListener("input", () => {
    playbackPosition = Number(progress.value);
    updateProgress();
    if (isPlaying) {
        startedAt = audioContext.currentTime - playbackPosition;
        nextNoteIndex = Math.floor(playbackPosition / 0.8);
    }
});

progress.max = trackDuration;
updateProgress();
