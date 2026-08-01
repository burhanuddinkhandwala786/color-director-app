// ==========================================
// 1. APP STATE & MENTOR ENGINE CONFIG
// ==========================================
let primaryImageData = null;
let referenceImageData = null;

let adjustState = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  temp: 0,
  saturation: 0
};

let activeTab = "mentor"; // "mentor" or "davinci"

// ==========================================
// 2. CORE UI RENDERING
// ==========================================
function renderApp() {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div class="bg-gray-950 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 text-white font-sans">
      
      <!-- Top Navigation Header -->
      <div class="flex flex-wrap justify-between items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 class="text-xl font-bold text-cyan-400 flex items-center gap-2">
            🎬 Color Director AI <span class="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-semibold">Pro Mentor Engine</span>
          </h1>
          <p class="text-xs text-gray-400 mt-1">Professional Scope Analysis, Skin Calibration & Color Science Guidance</p>
        </div>

        <div class="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button id="tabMentor" onclick="switchTab('mentor')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'mentor' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}">
            🧠 AI Mentor & Scopes
          </button>
          <button id="tabDaVinci" onclick="switchTab('davinci')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'davinci' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}">
            📚 Industry Node Blueprint
          </button>
        </div>
      </div>

      <!-- Image Ingestion Dropzones -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div id="dropzonePrimary" class="border-2 border-dashed border-gray-800 hover:border-cyan-400 rounded-xl p-4 text-center transition cursor-pointer bg-gray-900/40">
          <input type="file" id="filePrimary" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-cyan-400 uppercase tracking-wide">📸 1. Your Frame / Shot</p>
          <p class="text-xs text-gray-500 mt-1">Upload image for deep diagnostic analysis</p>
        </div>

        <div id="dropzoneRef" class="border-2 border-dashed border-gray-800 hover:border-purple-400 rounded-xl p-4 text-center transition cursor-pointer bg-gray-900/40">
          <input type="file" id="fileRef" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-purple-400 uppercase tracking-wide">🎬 2. Reference Target (Optional)</p>
          <p class="text-xs text-gray-500 mt-1">Upload a professional film still to match</p>
        </div>
      </div>

      <!-- Main Display Suite -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-900/80 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-[11px] text-cyan-400 mb-2 font-bold uppercase tracking-wider">Live Frame Preview</p>
          <canvas id="primaryCanvas" class="max-w-full max-h-[200px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-gray-900/80 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-[11px] text-purple-400 mb-2 font-bold uppercase tracking-wider">Reference Look Target</p>
          <canvas id="refCanvas" class="max-w-full max-h-[200px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-gray-900/80 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-[11px] text-cyan-400 mb-2 font-bold uppercase tracking-wider">360° YUV Vectorscope Telemetry</p>
          <canvas id="vectorscopeCanvas" width="180" height="180" class="w-[180px] h-[180px] bg-black rounded-full border border-gray-800"></canvas>
        </div>
      </div>

      <!-- DYNAMIC CONTENT: AI MENTOR vs DAVINCI BLUEPRINT -->
      <div id="tabContent"></div>

    </div>
  `;

  attachEventListeners();
  renderTabContent();
}

window.switchTab = function(tab) {
  activeTab = tab;
  renderApp();
};

// ==========================================
// 3. TAB RENDERING & MENTOR ENGINE
// ==========================================
function renderTabContent() {
  const container = document.getElementById("tabContent");
  if (!container) return;

  if (activeTab === "mentor") {
    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- Live AI Diagnostic & Telemetry Feedback Box -->
        <div class="bg-gray-900 border border-cyan-500/30 p-5 rounded-xl space-y-3">
          <div class="flex justify-between items-center border-b border-gray-800 pb-2">
            <p class="font-bold text-cyan-400 text-sm flex items-center gap-2">
              🧠 Senior Colorist AI Diagnosis & Technical Analysis
            </p>
            <span id="diagnosticBadge" class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400">
              Awaiting Image Data
            </span>
          </div>

          <div id="mentorReport" class="text-xs text-gray-300 leading-relaxed space-y-2">
            Upload a frame above. The AI Mentor will read scope telemetry, diagnose exposure/color flaws, and explain the exact color science behind fixing them.
          </div>
        </div>

        <!-- Interactive Precision Calibration Sliders -->
        <div class="bg-gray-900 border border-gray-800 p-5 rounded-xl space-y-4">
          <div class="flex justify-between items-center border-b border-gray-800 pb-3">
            <p class="font-bold text-gray-200 text-xs uppercase tracking-wider">🎛️ Interactive Calibration Sandbox</p>
            <div class="flex gap-2">
              <button onclick="resetSliders()" class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-semibold border border-gray-700 transition">
                🔄 Reset
              </button>
              <button onclick="export3DLUT()" class="px-3 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded text-xs font-bold border border-purple-500/30 transition">
                💾 Export Industry 3D .CUBE LUT
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
              <div class="flex justify-between font-semibold text-gray-300">
                <span>Exposure (EV)</span>
                <span id="valExposure" class="text-cyan-400">${adjustState.exposure}</span>
              </div>
              <input type="range" id="slideExposure" min="-100" max="100" value="${adjustState.exposure}" class="w-full accent-cyan-500 cursor-pointer" />
            </div>

            <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
              <div class="flex justify-between font-semibold text-gray-300">
                <span>Contrast</span>
                <span id="valContrast" class="text-cyan-400">${adjustState.contrast}</span>
              </div>
              <input type="range" id="slideContrast" min="-100" max="100" value="${adjustState.contrast}" class="w-full accent-cyan-500 cursor-pointer" />
            </div>

            <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
              <div class="flex justify-between font-semibold text-gray-300">
                <span>Temperature (Kelvin Offset)</span>
                <span id="valTemp" class="text-cyan-400">${adjustState.temp}</span>
              </div>
              <input type="range" id="slideTemp" min="-100" max="100" value="${adjustState.temp}" class="w-full accent-amber-500 cursor-pointer" />
            </div>

            <div class="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
              <div class="flex justify-between font-semibold text-gray-300">
                <span>Saturation</span>
                <span id="valSaturation" class="text-cyan-400">${adjustState.saturation}</span>
              </div>
              <input type="range" id="slideSaturation" min="-100" max="100" value="${adjustState.saturation}" class="w-full accent-cyan-500 cursor-pointer" />
            </div>
          </div>
        </div>

      </div>
    `;

    bindSliderEvents();
  } else {
    container.innerHTML = `
      <div class="bg-gray-900 border border-purple-500/30 p-5 rounded-xl space-y-4 text-xs">
        <p class="font-bold text-purple-400 text-sm flex items-center gap-2">
          📚 Industry Node Architecture & Color Pipeline Guide
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-black/40 border border-gray-800 p-4 rounded-xl space-y-2">
            <h3 class="font-bold text-cyan-300 text-xs uppercase tracking-wider">1. The Standard 4-Node Tree</h3>
            <p class="text-gray-400 leading-relaxed">
              Professional colorists in DaVinci Resolve never perform exposure, balancing, and creative grading on a single node. Always structure your pipeline sequentially:
            </p>
            <div class="space-y-1.5 text-gray-300 mt-2">
              <div class="bg-gray-900 p-2 rounded border border-gray-800"><strong class="text-cyan-400">Node 01 (Exposure/Recovery):</strong> Lift shadows, tame blown highlights, and recover sensor data.</div>
              <div class="bg-gray-900 p-2 rounded border border-gray-800"><strong class="text-cyan-400">Node 02 (Balance & White Balance):</strong> Ensure neutral whites and align skin tones to 123° on the Vectorscope.</div>
              <div class="bg-gray-900 p-2 rounded border border-gray-800"><strong class="text-cyan-400">Node 03 (Creative Look / LUT):</strong> Apply target grade, split-toning, or exported 3D .CUBE LUT.</div>
              <div class="bg-gray-900 p-2 rounded border border-gray-800"><strong class="text-cyan-400">Node 04 (Spatial Polish):</strong> Add vignetting, film grain, or edge sharpening.</div>
            </div>
          </div>

          <div class="bg-black/40 border border-gray-800 p-4 rounded-xl space-y-2">
            <h3 class="font-bold text-purple-300 text-xs uppercase tracking-wider">2. Reading Scopes Like an Expert</h3>
            <div class="space-y-2 text-gray-300">
              <p><strong class="text-white">Waveform (Luminance):</strong> Keep key subject skin sitting between 45–55 IRE. Avoid hitting 0 IRE (crushed blacks) or 1023 IRE (clipped highlights).</p>
              <p><strong class="text-white">Vectorscope (Chrominance):</strong> Human skin tone—regardless of ethnicity—sits precisely on the 123° Amber line (I-bar). Distance from center indicates saturation depth.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ==========================================
// 4. MENTOR DIAGNOSTIC ENGINE (COLOR SCIENCE)
// ==========================================
function runDiagnosticEngine() {
  const report = document.getElementById("mentorMentorReport") || document.getElementById("mentorReport");
  const badge = document.getElementById("diagnosticBadge");
  if (!report || !primaryImageData) return;

  const pData = primaryImageData.rawData;
  let pLumaSum = 0, rSum = 0, gSum = 0, bSum = 0;
  let lowLumaCount = 0, highLumaCount = 0;
  const sampleStep = 16;
  const totalPixels = pData.length / sampleStep;

  for (let i = 0; i < pData.length; i += sampleStep) {
    const r = pData[i], g = pData[i + 1], b = pData[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    rSum += r; gSum += g; bSum += b;
    pLumaSum += luma;

    if (luma < 20) lowLumaCount++;
    if (luma > 235) highLumaCount++;
  }

  const avgLuma = pLumaSum / totalPixels;
  const avgR = rSum / totalPixels;
  const avgG = gSum / totalPixels;
  const avgB = bSum / totalPixels;

  let adviceCards = [];

  // 1. Exposure Diagnosis & Cinematography Assessment
  if (avgLuma < 45) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800";
      badge.innerText = "Underexposed Frame";
    }
    adviceCards.push(`
      <div class="bg-red-950/30 border border-red-500/30 p-3 rounded-lg space-y-1">
        <p class="font-bold text-red-400">🌑 Technical Assessment: Low Key / Underexposed Scene</p>
        <p class="text-gray-300">Average luminance is sitting at <strong>${avgLuma.toFixed(1)} / 255</strong>. Deep shadows are burying detail.</p>
        <p class="text-gray-400 mt-1"><strong>Colorist Directive:</strong> In Node 1, lift your <em>Gamma / Midtones</em> by +0.8 EV and ease Lift up slightly to restore shadow detail without introducing digital noise.</p>
      </div>
    `);
  } else if (avgLuma > 115) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800";
      badge.innerText = "High-Key / Overexposed";
    }
    adviceCards.push(`
      <div class="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg space-y-1">
        <p class="font-bold text-amber-400">☀️ Technical Assessment: High Key / Overexposed Scene</p>
        <p class="text-gray-300">Average luminance is high (<strong>${avgLuma.toFixed(1)} / 255</strong>). Highlights are close to digital clipping.</p>
        <p class="text-gray-400 mt-1"><strong>Colorist Directive:</strong> Lower <em>Highlights / Gain</em> to pull bright areas back below 90% scale before applying your primary look.</p>
      </div>
    `);
  } else {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800";
      badge.innerText = "Balanced Signal Range";
    }
    adviceCards.push(`
      <div class="bg-green-950/30 border border-green-500/30 p-3 rounded-lg space-y-1">
        <p class="font-bold text-green-400">✅ Exposure Assessment: Well-Balanced Primary Signal</p>
        <p class="text-gray-300">Mean brightness sits comfortably at <strong>${avgLuma.toFixed(1)} / 255</strong>. Signal distribution is ready for creative color grading.</p>
      </div>
    `);
  }

  // 2. Color Balance & Chrominance Telemetry
  const warmCoolDelta = avgR - avgB;
  if (Math.abs(warmCoolDelta) > 12) {
    const toneType = warmCoolDelta > 0 ? "Warm Amber / Red" : "Cool Cyan / Blue";
    adviceCards.push(`
      <div class="bg-gray-900 border border-gray-800 p-3 rounded-lg space-y-1">
        <p class="font-bold text-cyan-400">🎨 Color Temperature Bias: ${toneType}</p>
        <p class="text-gray-300">The primary signal skews toward <strong>${toneType}</strong>.</p>
        <p class="text-gray-400 mt-1"><strong>Cinematography Tip:</strong> If this is an intentional sunset/golden-hour shot, maintain the bias. If shooting neutral daylight, adjust white balance on Node 2 to center the vectorscope scatter.</p>
      </div>
    `);
  }

  // 3. Reference Frame Delta Matching (If reference frame exists)
  if (referenceImageData) {
    adviceCards.push(`
      <div class="bg-purple-950/30 border border-purple-500/30 p-3 rounded-lg space-y-1">
        <p class="font-bold text-purple-300">🎬 Reference Matching Target Active</p>
        <p class="text-gray-300">Reference image loaded. Use the Interactive Calibration Sliders below or click <strong>Export Industry 3D .CUBE LUT</strong> to bake the visual translation into a LUT file.</p>
      </div>
    `);
  }

  report.innerHTML = adviceCards.join("");
}

// ==========================================
// 5. SLIDERS & PIXEL RENDERING ENGINE
// ==========================================
function bindSliderEvents() {
  const sliders = ["Exposure", "Contrast", "Temp", "Saturation"];
  sliders.forEach(s => {
    const el = document.getElementById(`slide${s}`);
    const valEl = document.getElementById(`val${s}`);
    if (el) {
      el.oninput = (e) => {
        const val = parseInt(e.target.value);
        adjustState[s.toLowerCase()] = val;
        if (valEl) valEl.innerText = val;
        requestAnimationFrame(applySandboxPipeline);
      };
    }
  });
}

window.resetSliders = function() {
  adjustState = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, temp: 0, saturation: 0 };
  renderApp();
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

  const expMult = Math.pow(2, adjustState.exposure / 50);
  const contrastFactor = (259 * (adjustState.contrast + 255)) / (255 * (259 - adjustState.contrast));
  const tempOffset = adjustState.temp * 0.8;
  const satMult = 1 + (adjustState.saturation / 100);

  for (let i = 0; i < raw.length; i += 4) {
    let r = raw[i] * expMult;
    let g = raw[i + 1] * expMult;
    let b = raw[i + 2] * expMult;

    r += tempOffset;
    b -= tempOffset;

    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

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
// 6. ASYNCHRONOUS FILE INGESTION & VECTORSCOPE
// ==========================================
function attachEventListeners() {
  bindDropzone("dropzonePrimary", "filePrimary", (file) => processImageFile(file, 'primary'));
  bindDropzone("dropzoneRef", "fileRef", (file) => processImageFile(file, 'reference'));
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
        applySandboxPipeline();
        runDiagnosticEngine();
      } else {
        referenceImageData = { img, imageData };
        runDiagnosticEngine();
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function restoreCanvasState() {
  if (primaryImageData) {
    applySandboxPipeline();
    runDiagnosticEngine();
  }

  if (referenceImageData) {
    const refCanvas = document.getElementById('refCanvas');
    if (refCanvas) {
      const ctx = refCanvas.getContext("2d");
      refCanvas.width = referenceImageData.imageData.width;
      refCanvas.height = referenceImageData.imageData.height;
      ctx.putImageData(referenceImageData.imageData, 0, 0);
    }
  }
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
// 7. PRECISE 3D .CUBE LUT EXPORTER
// ==========================================
function export3DLUT() {
  if (!primaryImageData) {
    alert("Please upload an image first to generate a 3D LUT!");
    return;
  }

  const lutSize = 17;
  const lines = [`# Color Director Pro Generated 3D LUT`, `LUT_3D_SIZE ${lutSize}`, ``];

  const expMult = Math.pow(2, adjustState.exposure / 50);
  const contrastFactor = (259 * (adjustState.contrast + 255)) / (255 * (259 - adjustState.contrast));
  const tempOffset = adjustState.temp * 0.8;
  const satMult = 1 + (adjustState.saturation / 100);

  for (let b = 0; b < lutSize; b++) {
    for (let g = 0; g < lutSize; g++) {
      for (let r = 0; r < lutSize; r++) {
        let rIn = (r / (lutSize - 1)) * 255;
        let gIn = (g / (lutSize - 1)) * 255;
        let bIn = (b / (lutSize - 1)) * 255;

        rIn *= expMult; gIn *= expMult; bIn *= expMult;
        rIn += tempOffset; bIn -= tempOffset;
        rIn = contrastFactor * (rIn - 128) + 128;
        gIn = contrastFactor * (gIn - 128) + 128;
        bIn = contrastFactor * (bIn - 128) + 128;

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
  const a = document.createElement("a");
  a.href = url;
  a.download = "Color_Director_ProGrade.cube";
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
