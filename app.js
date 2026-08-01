// ==========================================
// 1. APP STATE & AUTOMATED CALIBRATION ENGINE
// ==========================================
let primaryImageData = null;
let referenceImageData = null;

// Sliders mapped 1:1 to DaVinci Resolve Primary Wheels
let adjustState = {
  lift: 0,       // Shadows / Black Point (-100 to 100)
  gamma: 0,      // Midtones / Exposure (-100 to 100)
  gain: 0,       // Highlights / White Point (-100 to 100)
  temp: 0,       // Temperature (Cool / Warm)
  saturation: 0  // Saturation
};

let activeNodeFocus = "Node 01: Exposure & Recovery";

// ==========================================
// 2. CORE UI RENDERING
// ==========================================
function renderApp() {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div class="bg-gray-950 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 text-white font-sans">
      
      <!-- Top Navigation Header -->
      <div class="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 class="text-xl font-bold text-cyan-400 flex items-center gap-2">
            🎬 Color Director AI <span class="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-semibold">Auto-Fix & Scope Master</span>
          </h1>
          <p class="text-xs text-gray-400 mt-1">Automatic Image Recovery, Real-Time Scope Analysis & Live DaVinci Node Mapping</p>
        </div>
        <button onclick="export3DLUT()" class="px-4 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-bold border border-purple-500/40 transition shadow-lg">
          💾 Export DaVinci 3D .CUBE LUT
        </button>
      </div>

      <!-- Image Dropzones -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div id="dropzonePrimary" class="border-2 border-dashed border-gray-800 hover:border-cyan-400 rounded-xl p-4 text-center transition cursor-pointer bg-gray-900/40">
          <input type="file" id="filePrimary" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-cyan-400 uppercase tracking-wide">📸 1. Your Frame / Shot (Required)</p>
          <p class="text-xs text-gray-500 mt-1">Upload image to trigger automatic fix & analysis</p>
        </div>

        <div id="dropzoneRef" class="border-2 border-dashed border-gray-800 hover:border-purple-400 rounded-xl p-4 text-center transition cursor-pointer bg-gray-900/40">
          <input type="file" id="fileRef" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-purple-400 uppercase tracking-wide">🎬 2. Reference Target (Optional)</p>
          <p class="text-xs text-gray-500 mt-1">Upload a professional look to match</p>
        </div>
      </div>

      <!-- Main Display Suite -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-900/80 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-[11px] text-cyan-400 mb-2 font-bold uppercase tracking-wider">Live Calibrated Canvas</p>
          <canvas id="primaryCanvas" class="max-w-full max-h-[200px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-gray-900/80 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-[11px] text-purple-400 mb-2 font-bold uppercase tracking-wider">Reference Target Look</p>
          <canvas id="refCanvas" class="max-w-full max-h-[200px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-gray-900/80 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-[11px] text-cyan-400 mb-2 font-bold uppercase tracking-wider">360° YUV Vectorscope Telemetry</p>
          <canvas id="vectorscopeCanvas" width="180" height="180" class="w-[180px] h-[180px] bg-black rounded-full border border-gray-800"></canvas>
        </div>
      </div>

      <!-- Auto-Fix Status & Mentor Diagnosis -->
      <div class="bg-gray-900 border border-cyan-500/30 p-5 rounded-xl space-y-3">
        <div class="flex justify-between items-center border-b border-gray-800 pb-2">
          <p class="font-bold text-cyan-400 text-sm flex items-center gap-2">
            🤖 AI Automatic Fix Engine & Technical Report
          </p>
          <span id="diagnosticBadge" class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400">
            Awaiting Image
          </span>
        </div>
        <div id="mentorReport" class="text-xs text-gray-300 leading-relaxed space-y-2">
          Upload an image above. The engine will inspect signal luma, auto-adjust the sliders to restore exposure, and map the exact DaVinci node steps.
        </div>
      </div>

      <!-- DaVinci Primary Wheels Slider Controls -->
      <div class="bg-gray-900 border border-gray-800 p-5 rounded-xl space-y-4">
        <div class="flex justify-between items-center border-b border-gray-800 pb-3">
          <div>
            <p class="font-bold text-gray-200 text-xs uppercase tracking-wider">🎛️ DaVinci Resolve Primary Wheels Calibration</p>
            <p class="text-[11px] text-cyan-400 mt-0.5" id="activeNodeText">Active Focus: ${activeNodeFocus}</p>
          </div>
          <button onclick="resetSliders()" class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-semibold border border-gray-700 transition">
            🔄 Reset Controls
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          <!-- Gamma (Midtones) -->
          <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
            <div class="flex justify-between font-semibold text-gray-300">
              <span>Gamma (Midtones / Exposure)</span>
              <span id="valGamma" class="text-cyan-400">${adjustState.gamma}</span>
            </div>
            <input type="range" id="slideGamma" min="-100" max="100" value="${adjustState.gamma}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Lift (Shadows) -->
          <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
            <div class="flex justify-between font-semibold text-gray-300">
              <span>Lift (Shadows / Black Point)</span>
              <span id="valLift" class="text-cyan-400">${adjustState.lift}</span>
            </div>
            <input type="range" id="slideLift" min="-100" max="100" value="${adjustState.lift}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Gain (Highlights) -->
          <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
            <div class="flex justify-between font-semibold text-gray-300">
              <span>Gain (Highlights / Whites)</span>
              <span id="valGain" class="text-cyan-400">${adjustState.gain}</span>
            </div>
            <input type="range" id="slideGain" min="-100" max="100" value="${adjustState.gain}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Temperature -->
          <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
            <div class="flex justify-between font-semibold text-gray-300">
              <span>Temperature (Cool / Warm)</span>
              <span id="valTemp" class="text-amber-400">${adjustState.temp}</span>
            </div>
            <input type="range" id="slideTemp" min="-100" max="100" value="${adjustState.temp}" class="w-full accent-amber-500 cursor-pointer" />
          </div>

          <!-- Saturation -->
          <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
            <div class="flex justify-between font-semibold text-gray-300">
              <span>Saturation</span>
              <span id="valSaturation" class="text-cyan-400">${adjustState.saturation}</span>
            </div>
            <input type="range" id="slideSaturation" min="-100" max="100" value="${adjustState.saturation}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

        </div>
      </div>

      <!-- Live DaVinci Interactive Node Map -->
      <div class="bg-gray-900 border border-purple-500/30 p-5 rounded-xl space-y-3">
        <p class="font-bold text-purple-400 text-xs uppercase tracking-wider">🗺️ Interactive DaVinci Resolve Node Blueprint</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div id="node1Card" class="bg-black/50 p-3 rounded-lg border border-gray-800 transition">
            <strong class="text-cyan-400 block mb-1">Node 01: Exposure & Recovery</strong>
            <p class="text-gray-400 text-[11px]">Handles Gamma (Midtones) boost and Lift (Shadows) recovery to fix dark/blown signals.</p>
          </div>
          <div id="node2Card" class="bg-black/50 p-3 rounded-lg border border-gray-800 transition">
            <strong class="text-cyan-400 block mb-1">Node 02: Balance & White Balance</strong>
            <p class="text-gray-400 text-[11px]">Controls Temperature and Tint to center vectorscope scatter along the 123° skin line.</p>
          </div>
          <div id="node3Card" class="bg-black/50 p-3 rounded-lg border border-gray-800 transition">
            <strong class="text-purple-400 block mb-1">Node 03: Look / 3D LUT</strong>
            <p class="text-gray-400 text-[11px]">Receives exported 3D .CUBE LUT or creative split-toning grade.</p>
          </div>
        </div>
      </div>

    </div>
  `;

  attachEventListeners();
}

// ==========================================
// 3. AUTOMATIC IMAGE ANALYSIS & SLIDER AUTO-FIX
// ==========================================
function processImageFile(file, type) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvasId = type === 'primary' ? 'primaryCanvas' : 'refCanvas';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const maxDim = 800;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }

      const ctx = canvas.getContext("2d");
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);

      if (type === 'primary') {
        primaryImageData = { img, imageData, rawData: new Uint8ClampedArray(imageData.data) };
        
        // AUTO-FIX PIPELINE: Inspect luma and automatically apply corrective sliders
        autoCalibrateExposure(imageData);
      } else {
        referenceImageData = { img, imageData };
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function autoCalibrateExposure(imageData) {
  const pData = imageData.data;
  let pLumaSum = 0;
  const sampleStep = 16;
  const totalPixels = pData.length / sampleStep;

  for (let i = 0; i < pData.length; i += sampleStep) {
    const luma = 0.2126 * pData[i] + 0.7152 * pData[i + 1] + 0.0722 * pData[i + 2];
    pLumaSum += luma;
  }

  const avgLuma = pLumaSum / totalPixels;

  // AUTOMATIC SLIDER CALIBRATION LOGIC
  if (avgLuma < 45) { // Severe Underexposure
    const autoGain = Math.min(65, Math.round((55 - avgLuma) * 1.3));
    adjustState.gamma = autoGain; // Auto-boost midtones
    adjustState.lift = -10;       // Keep blacks anchored
    adjustState.saturation = 15;  // Restore pale colors
  } else if (avgLuma > 115) { // Overexposure
    const autoDrop = Math.max(-60, Math.round((100 - avgLuma) * 1.1));
    adjustState.gain = autoDrop;  // Auto-drop highlights
    adjustState.lift = -15;       // Re-crush washed contrast
  } else {
    adjustState = { lift: 0, gamma: 0, gain: 0, temp: 0, saturation: 0 };
  }

  // Sync Slider Elements visually
  syncSliderUI();
  applySandboxPipeline();
  runDiagnosticReport(avgLuma);
}

function syncSliderUI() {
  const sliders = ["Lift", "Gamma", "Gain", "Temp", "Saturation"];
  sliders.forEach(s => {
    const el = document.getElementById(`slide${s}`);
    const valEl = document.getElementById(`val${s}`);
    if (el) el.value = adjustState[s.toLowerCase()];
    if (valEl) valEl.innerText = adjustState[s.toLowerCase()];
  });
}

function runDiagnosticReport(avgLuma) {
  const report = document.getElementById("mentorReport");
  const badge = document.getElementById("exposureStatusBadge") || document.getElementById("diagnosticBadge");
  if (!report) return;

  if (avgLuma < 45) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800";
      badge.innerText = "Underexposed Shot — Auto-Corrected";
    }
    report.innerHTML = `
      <div class="bg-red-950/30 border border-red-500/30 p-3 rounded-lg space-y-1 text-xs">
        <p class="font-bold text-red-400">🌑 Auto-Fix Applied: Signal was severely underexposed (Luma ${avgLuma.toFixed(1)} / 255)</p>
        <p class="text-gray-300">The engine automatically boosted <strong>Gamma (Midtones) to +${adjustState.gamma}</strong> on screen to pull details out of the dark shadows.</p>
        <p class="text-gray-400 mt-1"><strong>DaVinci Resolve Instruction:</strong> On <strong>Node 01</strong>, grab the center of your <strong>Gamma Primary Wheel</strong> and nudge it upward until the Waveform trace midtones lift into the 400–600 IRE zone.</p>
      </div>
    `;
  } else if (avgLuma > 115) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800";
      badge.innerText = "Overexposed Shot — Auto-Corrected";
    }
    report.innerHTML = `
      <div class="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg space-y-1 text-xs">
        <p class="font-bold text-amber-400">☀️ Auto-Fix Applied: Shot was overexposed (Luma ${avgLuma.toFixed(1)} / 255)</p>
        <p class="text-gray-300">The engine automatically reduced <strong>Gain (Highlights) to ${adjustState.gain}</strong> to tame highlight glare.</p>
        <p class="text-gray-400 mt-1"><strong>DaVinci Resolve Instruction:</strong> On <strong>Node 01</strong>, pull down the <strong>Gain Wheel</strong> until whites drop below 900 IRE on the Waveform scope.</p>
      </div>
    `;
  } else {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800";
      badge.innerText = "Balanced Primary Signal";
    }
    report.innerHTML = `
      <div class="bg-green-950/30 border border-green-500/30 p-3 rounded-lg text-xs space-y-1">
        <p class="font-bold text-green-400">✅ Signal Exposure Balanced (Luma ${avgLuma.toFixed(1)} / 255)</p>
        <p class="text-gray-300">No emergency exposure recovery required on Node 01. You are ready to move to creative color grading on Node 02 & 03!</p>
      </div>
    `;
  }
}

// ==========================================
// 4. REAL-TIME PIXEL PROCESSING PIPELINE
// ==========================================
function bindSliderEvents() {
  const sliders = ["Lift", "Gamma", "Gain", "Temp", "Saturation"];
  sliders.forEach(s => {
    const el = document.getElementById(`slide${s}`);
    const valEl = document.getElementById(`val${s}`);
    if (el) {
      el.oninput = (e) => {
        const val = parseInt(e.target.value);
        adjustState[s.toLowerCase()] = val;
        if (valEl) valEl.innerText = val;
        
        // Highlight active DaVinci node
        highlightActiveNodeCard(s);
        requestAnimationFrame(applySandboxPipeline);
      };
    }
  });
}

function highlightActiveNodeCard(sliderName) {
  const n1 = document.getElementById("node1Card");
  const n2 = document.getElementById("node2Card");
  const nodeText = document.getElementById("activeNodeText");

  if (["Lift", "Gamma", "Gain"].includes(sliderName)) {
    activeNodeFocus = "Node 01: Exposure & Primary Wheels";
    if (n1) n1.className = "bg-cyan-950/60 p-3 rounded-lg border border-cyan-500 transition shadow";
    if (n2) n2.className = "bg-black/50 p-3 rounded-lg border border-gray-800 transition opacity-50";
  } else if (["Temp"].includes(sliderName)) {
    activeNodeFocus = "Node 02: White Balance & Color Calibration";
    if (n2) n2.className = "bg-cyan-950/60 p-3 rounded-lg border border-cyan-500 transition shadow";
    if (n1) n1.className = "bg-black/50 p-3 rounded-lg border border-gray-800 transition opacity-50";
  }
  if (nodeText) nodeText.innerText = `Active Focus: ${activeNodeFocus}`;
}

window.resetSliders = function() {
  adjustState = { lift: 0, gamma: 0, gain: 0, temp: 0, saturation: 0 };
  syncSliderUI();
  applySandboxPipeline();
};

function applySandboxPipeline() {
  if (!primaryImageData) return;

  const canvas = document.getElementById('primaryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const width = primaryImageData.imageData.width;
  const height = primaryImageData.imageData.height;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  const raw = primaryImageData.rawData;

  // DaVinci Primary Wheels Mathematical Formula Representation
  const gammaMult = Math.pow(2, adjustState.gamma / 40);
  const liftOffset = adjustState.lift * 0.6;
  const gainMult = 1 + (adjustState.gain / 100);
  const tempOffset = adjustState.temp * 0.8;
  const satMult = 1 + (adjustState.saturation / 100);

  for (let i = 0; i < raw.length; i += 4) {
    let r = raw[i];
    let g = raw[i + 1];
    let b = raw[i + 2];

    // 1. Lift (Shadows Offset)
    r += liftOffset; g += liftOffset; b += liftOffset;

    // 2. Gamma (Midtones Multiplier)
    r *= gammaMult; g *= gammaMult; b *= gammaMult;

    // 3. Gain (Highlights Scale)
    r *= gainMult; g *= gainMult; b *= gainMult;

    // 4. Temperature Offset
    r += tempOffset; b -= tempOffset;

    // 5. Saturation Matrix
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + satMult * (r - gray);
    g = gray + satMult * (g - gray);
    b = gray + satMult * (b - gray);

    data[i]     = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
    data[i + 3] = raw[i + 3];
  }

  ctx.putImageData(imgData, 0, 0);
  drawVectorscope(imgData);
}

// ==========================================
// 5. ASYNCHRONOUS EVENT BINDINGS & SCOPES
// ==========================================
function attachEventListeners() {
  bindDropzone("dropzonePrimary", "filePrimary", (file) => processImageFile(file, 'primary'));
  bindDropzone("dropzoneRef", "fileRef", (file) => processImageFile(file, 'reference'));
  bindSliderEvents();
}

function bindDropzone(dropzoneId, inputId, callback) {
  const zone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.onclick = () => input.click();
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add("border-cyan-400"); };
  zone.ondragleave = () => zone.classList.remove("border-cyan-400");
  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove("border-cyan-400");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) callback(e.dataTransfer.files[0]);
  };
  input.onchange = (e) => {
    if (e.target.files && e.target.files[0]) callback(e.target.files[0]);
  };
}

function drawVectorscope(imageData) {
  const canvas = document.getElementById("vectorscopeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width; 
  const center = size / 2;
  const radius = center - 10;

  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center, 5); ctx.lineTo(center, size - 5);
  ctx.moveTo(5, center); ctx.lineTo(size - 5, center);
  ctx.stroke();

  const skinAngle = (123 * Math.PI) / 180;
  ctx.strokeStyle = "#f59e0b"; 
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.lineTo(center + Math.cos(skinAngle) * radius, center - Math.sin(skinAngle) * radius);
  ctx.stroke();

  const pixels = imageData.data;
  const step = Math.max(16, Math.floor((pixels.length / 4) / 4000)) * 4;
  ctx.fillStyle = "rgba(6, 182, 212, 0.4)";

  for (let i = 0; i < pixels.length; i += step) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

    const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
    const v = 0.615 * r - 0.51499 * g - 0.10001 * b;

    const x = center + (u * (radius / 128));
    const y = center - (v * (radius / 128));

    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

// ==========================================
// 6. PRECISE 3D .CUBE LUT EXPORTER
// ==========================================
function export3DLUT() {
  if (!primaryImageData) {
    alert("Please upload an image first to generate a 3D LUT!");
    return;
  }

  const lutSize = 17;
  const lines = [`# Color Director Pro Generated 3D LUT`, `LUT_3D_SIZE ${lutSize}`, ``];

  const gammaMult = Math.pow(2, adjustState.gamma / 40);
  const liftOffset = adjustState.lift * 0.6;
  const gainMult = 1 + (adjustState.gain / 100);
  const tempOffset = adjustState.temp * 0.8;
  const satMult = 1 + (adjustState.saturation / 100);

  for (let b = 0; b < lutSize; b++) {
    for (let g = 0; g < lutSize; g++) {
      for (let r = 0; r < lutSize; r++) {
        let rIn = (r / (lutSize - 1)) * 255;
        let gIn = (g / (lutSize - 1)) * 255;
        let bIn = (b / (lutSize - 1)) * 255;

        rIn += liftOffset; gIn += liftOffset; bIn += liftOffset;
        rIn *= gammaMult; gIn *= gammaMult; bIn *= gammaMult;
        rIn *= gainMult; gIn *= gainMult; bIn *= gainMult;

        rIn += tempOffset; bIn -= tempOffset;

        const gray = 0.2126 * rIn + 0.7152 * gIn + 0.0722 * bIn;
        rIn = gray + satMult * (rIn - gray);
        gIn = gray + satMult * (gIn - gray);
        bIn = gray + satMult * (bIn - gray);

        const rOut = (Math.min(255, Math.max(0, rIn)) / 255).toFixed(6);
        const gOut = (Math.min(255, Math.max(0, gIn)) / 255).toFixed(6);
        const bOut = (Math.min(255, Math.max(0, bIn)) / 255).toFixed(6);

        lines.push(`${rOut} ${gOut} ${bOut}`);
      }
    }
  }

  const blob = new Blob([lines.join('\n')], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.getElementById("exportLutAnchor") || document.createElement("a");
  a.href = url;
  a.download = "Color_Director_DaVinciGrade.cube";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

try {
  renderApp();
} catch (err) {
  console.error("App initialization error:", err);
}
