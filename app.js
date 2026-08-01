// ==========================================
// 1. APP STATE & SANDBOX ENGINE PARAMETERS
// ==========================================
let primaryImageData = null;
let referenceImageData = null;

// Real-time Live Sandbox Adjustments State
let adjustState = {
  exposure: 0,     // -100 to 100
  contrast: 0,     // -100 to 100
  highlights: 0,   // -100 to 100
  shadows: 0,      // -100 to 100
  temp: 0,         // -100 (Cool) to 100 (Warm)
  tint: 0,         // -100 (Green) to 100 (Magenta)
  saturation: 0    // -100 (B&W) to 100 (Vibrant)
};

let activeTab = "sandbox"; // "sandbox" or "davinci"

// ==========================================
// 2. CORE UI LAYOUT ENGINE
// ==========================================
function renderApp() {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div class="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
      
      <!-- Top Navigation Header -->
      <div class="flex flex-wrap justify-between items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 class="text-xl font-bold text-cyan-400">Color Director AI — Sandbox & Scope Master</h1>
          <p class="text-xs text-gray-400 mt-1">Interactively grade shots, generate 3D LUTs, or master DaVinci Resolve scopes.</p>
        </div>

        <!-- Engine Mode Switcher -->
        <div class="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button id="tabSandbox" onclick="switchTab('sandbox')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'sandbox' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}">
            🎨 Interactive Live Sandbox
          </button>
          <button id="tabDaVinci" onclick="switchTab('davinci')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'davinci' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}">
            🎬 DaVinci Scope Masterclass
          </button>
        </div>
      </div>

      <!-- Image Upload Dropzones -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div id="dropzonePrimary" class="border-2 border-dashed border-gray-700 hover:border-cyan-400 rounded-xl p-4 text-center transition cursor-pointer bg-gray-950/50">
          <input type="file" id="filePrimary" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-cyan-400 uppercase tracking-wide">📸 1. Upload Your Shot</p>
          <p class="text-xs text-gray-400 mt-1">Drag & drop or click to load snapshot</p>
        </div>

        <div id="dropzoneRef" class="border-2 border-dashed border-gray-700 hover:border-purple-400 rounded-xl p-4 text-center transition cursor-pointer bg-gray-950/50">
          <input type="file" id="fileRef" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-purple-400 uppercase tracking-wide">🎬 2. Target Reference (Optional)</p>
          <p class="text-xs text-gray-400 mt-1">Compare target frame or movie still</p>
        </div>
      </div>

      <!-- Main Dual Display & Vectorscope Suite -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-black/60 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[200px]">
          <p class="text-xs text-cyan-400 mb-2 font-bold uppercase tracking-wider">Live Sandbox Canvas</p>
          <canvas id="primaryCanvas" class="max-w-full max-h-[220px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-black/60 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[200px]">
          <p class="text-xs text-purple-400 mb-2 font-bold uppercase tracking-wider">Reference Look</p>
          <canvas id="refCanvas" class="max-w-full max-h-[220px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-black/60 rounded-xl p-3 border border-gray-800 flex flex-col items-center justify-center min-h-[200px]">
          <p class="text-xs text-cyan-400 mb-2 font-bold uppercase tracking-wider">Live YUV Vectorscope</p>
          <canvas id="vectorscopeCanvas" width="180" height="180" class="w-[180px] h-[180px] bg-gray-950 rounded-full border border-gray-800"></canvas>
        </div>
      </div>

      <!-- DYNAMIC CONTENT: SANDBOX SLIDERS vs DAVINCI MASTERCLASS -->
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
// 3. TAB RENDERING: SANDBOX vs DAVINCI MASTER
// ==========================================
function renderTabContent() {
  const container = document.getElementById("tabContent");
  if (!container) return;

  if (activeTab === "sandbox") {
    container.innerHTML = `
      <div class="bg-gray-950 border border-cyan-500/30 p-5 rounded-2xl space-y-4">
        <div class="flex justify-between items-center border-b border-gray-800 pb-3">
          <p class="font-bold text-cyan-400 text-sm flex items-center gap-2">
            🎛️ Real-Time Interactive Sandbox Controls
          </p>
          <div class="flex gap-2">
            <button onclick="resetSliders()" class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold border border-gray-700 transition">
              🔄 Reset Sliders
            </button>
            <button onclick="export3DLUT()" class="px-3 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-bold border border-purple-500/30 transition">
              💾 Export 3D .CUBE LUT
            </button>
          </div>
        </div>

        <!-- Interactive Sliders Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          <!-- Exposure -->
          <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
            <div class="flex justify-between font-bold text-gray-300">
              <span>☀️ Exposure</span>
              <span id="valExposure" class="text-cyan-400">${adjustState.exposure}</span>
            </div>
            <input type="range" id="slideExposure" min="-100" max="100" value="${adjustState.exposure}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Contrast -->
          <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
            <div class="flex justify-between font-bold text-gray-300">
              <span>☯️ Contrast</span>
              <span id="valContrast" class="text-cyan-400">${adjustState.contrast}</span>
            </div>
            <input type="range" id="slideContrast" min="-100" max="100" value="${adjustState.contrast}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Highlights -->
          <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
            <div class="flex justify-between font-bold text-gray-300">
              <span>🏔️ Highlights</span>
              <span id="valHighlights" class="text-cyan-400">${adjustState.highlights}</span>
            </div>
            <input type="range" id="slideHighlights" min="-100" max="100" value="${adjustState.highlights}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Shadows -->
          <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
            <div class="flex justify-between font-bold text-gray-300">
              <span>🌑 Shadows</span>
              <span id="valShadows" class="text-cyan-400">${adjustState.shadows}</span>
            </div>
            <input type="range" id="slideShadows" min="-100" max="100" value="${adjustState.shadows}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

          <!-- Temperature -->
          <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
            <div class="flex justify-between font-bold text-gray-300">
              <span>🌡️ Temperature (Cool / Warm)</span>
              <span id="valTemp" class="text-cyan-400">${adjustState.temp}</span>
            </div>
            <input type="range" id="slideTemp" min="-100" max="100" value="${adjustState.temp}" class="w-full accent-amber-500 cursor-pointer" />
          </div>

          <!-- Saturation -->
          <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
            <div class="flex justify-between font-bold text-gray-300">
              <span>🎨 Saturation</span>
              <span id="valSaturation" class="text-cyan-400">${adjustState.saturation}</span>
            </div>
            <input type="range" id="slideSaturation" min="-100" max="100" value="${adjustState.saturation}" class="w-full accent-cyan-500 cursor-pointer" />
          </div>

        </div>
      </div>
    `;

    bindSliderEvents();
  } else {
    container.innerHTML = `
      <div class="bg-gray-950 border border-purple-500/30 p-5 rounded-2xl space-y-4 text-xs">
        <p class="font-bold text-purple-400 text-sm flex items-center gap-2">
          🎬 Native DaVinci Resolve Masterclass: Reading Scopes Like a Pro
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Waveform Scope Guide -->
          <div class="bg-gray-900/90 border border-gray-800 p-4 rounded-xl space-y-2">
            <h3 class="font-bold text-cyan-300 text-sm border-b border-gray-800 pb-1">1. The Waveform Scope (Luminance & Exposure)</h3>
            <p class="text-gray-300 leading-relaxed">
              Open DaVinci's Scope window (<code class="bg-black px-1 py-0.5 rounded text-amber-300">Workspace ➔ Scopes ➔ Waveform</code>).
            </p>
            <ul class="list-disc pl-4 space-y-1.5 text-gray-400">
              <li><strong class="text-white">1024 Line (Top):</strong> Pure white highlight clip zone. If signals smash against 1024, your sky or whites are permanently blown out.</li>
              <li><strong class="text-white">400 - 600 Range (Middle):</strong> Where standard middle gray and skin tones belong.</li>
              <li><strong class="text-white">0 Line (Bottom):</strong> Pure black. If trace data hits 0, shadow details are crushed. Adjust <code class="text-cyan-300">Lift</code> wheel until shadows sit comfortably around 64-128.</li>
            </ul>
          </div>

          <!-- RGB Parade Guide -->
          <div class="bg-gray-900/90 border border-gray-800 p-4 rounded-xl space-y-2">
            <h3 class="font-bold text-purple-300 text-sm border-b border-gray-800 pb-1">2. RGB Parade Scope (Color Balance)</h3>
            <p class="text-gray-300 leading-relaxed">
              Switch Scope to <code class="bg-black px-1 py-0.5 rounded text-amber-300">Parade (RGB)</code>. It separates your shot into Red, Green, and Blue columns.
            </p>
            <ul class="list-disc pl-4 space-y-1.5 text-gray-400">
              <li><strong class="text-white">White Balance Calibration:</strong> If all 3 columns align at equal heights, your neutral whites/grays are perfectly balanced.</li>
              <li><strong class="text-white">Warm / Sunset Grade:</strong> The Red column trace sits higher than Blue.</li>
              <li><strong class="text-white">Cinematic Teal & Orange:</strong> Red trace sits high in midtones, Blue trace sits high in the bottom shadows.</li>
            </ul>
          </div>
        </div>

        <div class="bg-purple-950/40 border border-purple-500/30 p-3 rounded-xl">
          <strong class="text-purple-300 block">💡 Pro Colorist Workflow:</strong>
          <span class="text-gray-300">Use Node 1 in DaVinci to balance the Waveform scope so no data hits 0 or 1024. Then, apply the 3D LUT exported from our Interactive Sandbox on Node 2!</span>
        </div>
      </div>
    `;
  }
}

// ==========================================
// 4. REAL-TIME PIXEL PROCESSING & SLIDERS
// ==========================================
function bindSliderEvents() {
  const sliders = ["Exposure", "Contrast", "Highlights", "Shadows", "Temp", "Saturation"];
  sliders.forEach(s => {
    const el = document.getElementById(`slide${s}`);
    const valEl = document.getElementById(`val${s}`);
    if (el) {
      el.oninput = (e) => {
        const val = parseInt(e.target.value);
        adjustState[s.toLowerCase()] = val;
        if (valEl) valEl.innerText = val;
        
        // Debounced non-blocking render on animation frame
        requestAnimationFrame(applySandboxPipeline);
      };
    }
  });
}

window.resetSliders = function() {
  adjustState = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, temp: 0, tint: 0, saturation: 0 };
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

  // Real-Time Slider Adjustments Math
  const expMult = Math.pow(2, adjustState.exposure / 50); // Exposure EV scale
  const contrastFactor = (259 * (adjustState.contrast + 255)) / (255 * (259 - adjustState.contrast));
  const tempOffset = adjustState.temp * 0.8;
  const satMult = 1 + (adjustState.saturation / 100);

  for (let i = 0; i < raw.length; i += 4) {
    let r = raw[i];
    let g = raw[i + 1];
    let b = raw[i + 2];

    // 1. Exposure
    r *= expMult;
    g *= expMult;
    b *= expMult;

    // 2. Temperature (Cool / Warm)
    r += tempOffset;
    b -= tempOffset;

    // 3. Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // 4. Saturation
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + satMult * (r - gray);
    g = gray + satMult * (g - gray);
    b = gray + satMult * (b - gray);

    // Clamp values [0, 255]
    data[i]     = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
    data[i + 3] = raw[i + 3];
  }

  ctx.putImageData(imgData, 0, 0);

  // Dynamically update vectorscope based on edited image data
  drawVectorscope(imgData);
}

// ==========================================
// 5. ASYNCHRONOUS FILE INGESTION
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
      } else {
        referenceImageData = { img, imageData };
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function restoreCanvasState() {
  if (primaryImageData) {
    applySandboxPipeline();
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

// ==========================================
// 6. VECTORSCOPE ENGINE
// ==========================================
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
  const lines = [`# Color Director Interactive Generated 3D LUT`, `LUT_3D_SIZE ${lutSize}`, ``];

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

        // Apply Sandbox Transformation Grid to LUT Nodes
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
  a.download = "Color_Director_CustomGrade.cube";
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
