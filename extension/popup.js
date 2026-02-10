const LEDGER_API = 'http://localhost:8000';

let isRecording = false;
let startTime = null;
let timerInterval = null;

// Check if on a meeting page
function detectMeeting() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    const isMeeting = 
      url.includes('meet.google.com') ||
      url.includes('zoom.us/j/') ||
      url.includes('teams.microsoft.com/l/meetup-join');
    
    if (isMeeting) {
      document.getElementById('detected').style.display = 'block';
      document.getElementById('meetingTitle').value = tabs[0]?.title?.replace(' - Google Meet', '').replace(' | Microsoft Teams', '') || '';
    }
  });
}

// Check login status
async function checkAuth() {
  const token = await chrome.storage.local.get('ledgerToken');
  if (!token.ledgerToken) {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'block';
    return false;
  }
  return true;
}

// Format time
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Update timer
function updateTimer() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('timer').textContent = formatTime(elapsed);
}

// Start recording
async function startRecording() {
  const hasAuth = await checkAuth();
  if (!hasAuth) return;

  try {
    // Request tab capture
    chrome.tabCapture.capture({
      audio: true,
      video: false
    }, (stream) => {
      if (!stream) {
        alert('Failed to capture audio. Make sure you\'re on a meeting tab.');
        return;
      }

      // Store stream for later
      chrome.storage.local.set({ isRecording: true });
      
      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Store recorder reference
      window.mediaRecorder = mediaRecorder;
      window.audioStream = stream;
      
      mediaRecorder.start(1000); // Collect data every second

      // Update UI
      isRecording = true;
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 1000);
      
      document.getElementById('status').className = 'status recording';
      document.getElementById('status').innerHTML = '<span class="dot"></span>Recording...';
      document.getElementById('timer').style.display = 'block';
      document.getElementById('startBtn').style.display = 'none';
      document.getElementById('stopBtn').style.display = 'block';
      document.getElementById('setup').style.display = 'none';
    });
  } catch (err) {
    console.error('Failed to start recording:', err);
    alert('Failed to start recording: ' + err.message);
  }
}

// Stop recording
function stopRecording() {
  if (window.mediaRecorder && window.mediaRecorder.state !== 'inactive') {
    window.mediaRecorder.stop();
  }
  
  isRecording = false;
  clearInterval(timerInterval);
  chrome.storage.local.set({ isRecording: false });
  
  document.getElementById('status').className = 'status';
  document.getElementById('status').textContent = 'Processing...';
  document.getElementById('stopBtn').disabled = true;
}

// Upload recording to Ledger
async function uploadRecording(blob) {
  const { ledgerToken } = await chrome.storage.local.get('ledgerToken');
  const meetingTitle = document.getElementById('meetingTitle').value || 'Meeting Recording';

  try {
    // First create a meeting
    const meetingRes = await fetch(`${LEDGER_API}/meetings/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ledgerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: meetingTitle,
        platform: 'Browser Recording',
      }),
    });

    if (!meetingRes.ok) throw new Error('Failed to create meeting');
    const { meeting_id } = await meetingRes.json();

    // Upload audio
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    formData.append('meeting_id', meeting_id);

    document.getElementById('status').textContent = 'Transcribing...';

    const uploadRes = await fetch(`${LEDGER_API}/audio/transcribe-and-extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ledgerToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.json();
      throw new Error(error.detail || 'Failed to transcribe');
    }

    document.getElementById('status').textContent = '✅ Done! Opening Ledger...';
    
    // Open meeting in Ledger
    chrome.tabs.create({ url: `http://localhost:5173/meetings/${meeting_id}` });

  } catch (err) {
    console.error('Upload failed:', err);
    document.getElementById('status').textContent = '❌ ' + err.message;
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('startBtn').style.display = 'block';
  }
}

// Login handler
document.getElementById('loginBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173/login?extension=true' });
});

// Start button
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('setup').style.display = 'block';
  document.getElementById('startBtn').textContent = '🎤 Start Recording Now';
  document.getElementById('startBtn').onclick = startRecording;
});

// Stop button
document.getElementById('stopBtn').addEventListener('click', stopRecording);

// Initialize
detectMeeting();
checkAuth();

// Check for existing recording state
chrome.storage.local.get('isRecording', ({ isRecording: recording }) => {
  if (recording) {
    document.getElementById('status').className = 'status recording';
    document.getElementById('status').innerHTML = '<span class="dot"></span>Recording in progress...';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';
  }
});