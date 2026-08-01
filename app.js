// ==========================================
// 1. APP STATE & GUIDED STEPS
// ==========================================
const STEPS = [
  {
    title: "Step 1: Exposure Assessment & Detail Recovery",
    instruction: "Upload your shot. The app will inspect pixel luma data and tell you if exposure recovery is required.",
    action: "Exposure Assessment"
  },
  {
    title: "Step 2: Color Calibration & Mood Alignment",
    instruction: "Align skin tones using the 360° Vectorscope or select a mood preset to match target hues.",
    action: "Mood Alignment"
  },
  {
    title: "Step 3: Grade Finalization & LUT Export",
    instruction: "Review the full recovery checklist or click 'Export 3D .CUBE LUT' for 1-click application.",
    action: "Grade Export"
  }
];

const MOOD_PRESETS = {
  cinematic: { name: "🎬 Moody Cinematic", lumaTarget: 80, warmBias: -10, description: "Lowered exposure, deep shadows, cool/teal midtones." },
  golden: { name: "🌅 Golden Hour", lumaTarget: 110, warmBias: 25, description: "Warm golden highlights, soft contrast, glowing skin." },
  tealOrange: { name: "🎨 Teal & Orange", lumaTarget: 95, warmBias: 15, description: "Punchy contrast, warm skin, cool cyan background." },
  vintage: { name: "📸 Vintage Film", lumaTarget: 105, warmBias: 10, description: "Faded blacks, warm cream highlights, classic film feel." }
};

let currentStep = 0;
let primaryImageData = null;
let referenceImageData = null;
let activePreset = null;
let isFalseColorActive = false;
let selectedSoftware = "davinci"; // Default software selection

// ==========================================
// 2. CORE RENDERING ENGINE
// ==========================================
function renderApp() {
  const root = document.getElementById("root");
  if (!root) return;

  const step = STEPS[currentStep];

  root.innerHTML = `
    <div class="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
      
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center border-b border-gray-800 pb-4 gap-2">
        <div>
          <h1 class="text-xl font-bold text-cyan-400">${step.title}</h1>
          <p class="text-xs text-gray-400 mt-1">${step.instruction}</p>
        </div>
        
        <!-- Software Selection Dropdown -->
        <div class="flex items-center gap-2 bg-gray-950 p-1.5 rounded-lg border border-gray-800">
          <label class="text-[11px] font-bold text-gray-400">Software:</label>
          <select id="softwareSelect" class="bg-gray-900 text-cyan-300 text-xs font-semibold rounded px-2 py-1 border border-gray-700 outline-none">
            <option value="davinci" ${selectedSoftware === 'davinci' ? 'selected' : ''}>DaVinci Resolve</option>
            <option value="premiere" ${selectedSoftware === 'premiere' ? 'selected' : ''}>Adobe Premiere</option>
            <option value="lightroom" ${selectedSoftware === 'lightroom' ? 'selected' : ''}>Lightroom / Camera Raw</option>
            <option value="capcut" ${selectedSoftware === 'capcut' ? 'selected' : ''}>CapCut / Mobile</option>
          </select>
        </div>
      </div>

      <!-- Image Ingestion Dropzones -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div id="dropzonePrimary" class="border-2 border-dashed border-gray-700 hover:border-cyan-400 rounded-xl p-4 text-center transition-all cursor-pointer bg-gray-950/50">
          <input type="file" id="filePrimary" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-cyan-400 uppercase tracking-wide">📸 1. Your Shot (Required)</p>
          <p class="text-xs text-gray-400 mt-1">Drag & drop or click to upload</p>
        </div>

        <div id="dropzoneRef" class="border-2 border-dashed border-gray-700 hover:border-purple-400 rounded-xl p-4 text-center transition-all cursor-pointer bg-gray-950/50">
          <input type="file" id="fileRef" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-purple-400 uppercase tracking-wide">🎬 2. Reference Image (Optional)</p>
          <p class="text-xs text-gray-400 mt-1">Drop a movie still or look you want to copy</p>
        </div>
      </div>

      <!-- Target Mood Presets -->
      <div class="bg-gray-950/60 p-3 rounded-xl border border-gray-800 space-y-2">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Mood Presets (Or use reference above):</p>
        <div class="flex flex-wrap gap-2">
          ${Object.keys(MOOD_PRESETS).map(key => `
            <button 
              onclick="selectPreset('${key}')" 
              class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${activePreset === key ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}"
            >
              ${MOOD_PRESETS[key].name}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Toolbar Controls -->
      <div id="toolbar" class="flex flex-wrap gap-2 items-center justify-between border-t border-b border-gray-800 py-3">
        <button id="toggleFalseColor" class="px-3 py-1.5 ${isFalseColorActive ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-300'} hover:bg-cyan-600 rounded-lg text-xs font-semibold border border-gray-700 transition">
          🎨 ${isFalseColorActive ? 'Disable Exposure Map' : 'Toggle Visual Exposure Map'}
        </button>

        <button id="exportLUT" class="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-semibold border border-purple-500/30 transition">
          💾 Export 3D .CUBE LUT
        </button>
      </div>

      <!-- Preview Displays -->
      <div id="previewContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center relative min-h-[200px] justify-center">
          <p class="text-xs text-gray-400 mb-2 font-semibold">YOUR SHOT</p>
          <div class="relative max-w-full max-h-[180px]">
            <canvas id="primaryCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg block"></canvas>
            <canvas id="falseColorCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg absolute top-0 left-0 hidden"></canvas>
          </div>
        </div>

        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center min-h-[200px] justify-center">
          <p class="text-xs text-purple-400 mb-2 font-semibold">TARGET REFERENCE</p>
          <canvas id="refCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center min-h-[200px] justify-center">
          <p class="text-xs text-cyan-400 mb-2 font-semibold">COLOR DISTRIBUTION</p>
          <canvas id="vectorscopeCanvas" width="180" height="180" class="w-[180px] h-[180px] bg-gray-950 rounded-full border border-gray-800"></canvas>
        </div>
      </div>

      <!-- Live Interactive On-Screen Assistant -->
      <div id="critiqueBox" class="bg-gray-950 border border-cyan-500/30 p-5 rounded-xl text-xs space-y-3">
        <div class="flex justify-between items-center">
          <p class="font-bold text-cyan-400 text-sm flex items-center gap-2">
            <span>🤖</span> Live App Guidance & Action Steps
          </p>
          <span id="exposureStatusBadge" class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400">
            Awaiting Image
          </span>
        </div>
        
        <div id="critiqueFeedback" class="text-gray-300 space-y-2 leading-relaxed">
          Upload an image above. The app will automatically analyze your pixels and generate your step-by-step recovery checklist right here.
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between pt-2">
        <button id="prevBtn" ${currentStep === 0 ? 'disabled' : ''} class="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-700 transition">
          Previous Step
        </button>
        <button id="nextBtn" ${currentStep === STEPS.length - 1 ? 'disabled' : ''} class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold text-white disabled:opacity-30 transition">
          Next Step
        </button>
      </div>
    </div>
  `;

  attachEventListeners();
  restoreCanvasState();
}

window.selectPreset = function(key) {
  activePreset = key;
  renderApp();
};

// ==========================================
// 3. EVENT BINDINGS
// ==========================================
function attachEventListeners() {
  bindDropzone("dropzonePrimary", "filePrimary", (file) => processImageFile(file, 'primary'));
  bindDropzone("dropzoneRef", "fileRef", (file) => processImageFile(file, 'reference'));

  document.getElementById("toggleFalseColor").onclick = toggleFalseColorMode;
  document.getElementById("exportLUT").onclick = export3DLUT;

  const swSelect = document.getElementById("softwareSelect");
  if (swSelect) {
    swSelect.onchange = (e) => {
      selectedSoftware = e.target.value;
      if (primaryImageData) runAppOnScreenGuidance();
    };
  }

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) prevBtn.onclick = () => { if (currentStep > 0) { currentStep--; renderApp(); } };
  if (nextBtn) nextBtn.onclick = () => { if (currentStep < STEPS.length - 1) { currentStep++; renderApp(); } };
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

// ==========================================
// 4. ASYNCHRONOUS NON-BLOCKING IMAGE ENGINE
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
        isFalseColorActive = false;

        setTimeout(() => {
          generateFalseColorOverlay(w, h);
          drawVectorscope(imageData);
          runAppOnScreenGuidance();
        }, 0);
      } else {
        referenceImageData = { img, imageData };
        activePreset = null;
        setTimeout(() => runAppOnScreenGuidance(), 0);
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function restoreCanvasState() {
  if (primaryImageData) {
    const canvas = document.getElementById('primaryCanvas');
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = primaryImageData.imageData.width;
      canvas.height = primaryImageData.imageData.height;
      ctx.putImageData(primaryImageData.imageData, 0, 0);

      generateFalseColorOverlay(canvas.width, canvas.height);
      drawVectorscope(primaryImageData.imageData);

      const fcCanvas = document.getElementById("falseColorCanvas");
      if (fcCanvas) {
        if (isFalseColorActive) fcCanvas.classList.remove("hidden");
        else fcCanvas.classList.add("hidden");
      }
    }
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

  if (primaryImageData) runAppOnScreenGuidance();
}

// ==========================================
// 5. INSTANT CSS-BASED FALSE COLOR TOGGLE (0ms LATENCY)
// ==========================================
function generateFalseColorOverlay(width, height) {
  const fcCanvas = document.getElementById("falseColorCanvas");
  if (!fcCanvas || !primaryImageData) return;

  fcCanvas.width = width;
  fcCanvas.height = height;
  const ctx = fcCanvas.getContext("2d");
  const imgData = ctx.createImageData(width, height);
  const targetData = imgData.data;
  const raw = primaryImageData.rawData;

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luma >= 250) {          // Highlight clipping -> Red
      targetData[i] = 255; targetData[i + 1] = 0; targetData[i + 2] = 0;
    } else if (luma >= 100 && luma <= 115) { // Skin Highs -> Pink
      targetData[i] = 255; targetData[i + 1] = 105; targetData[i + 2] = 180;
    } else if (luma >= 40 && luma <= 48) {   // Midtones -> Green
      targetData[i] = 0; targetData[i + 1] = 255; targetData[i + 2] = 0;
    } else if (luma <= 10) {                 // Shadows Crushed -> Purple
      targetData[i] = 128; targetData[i + 1] = 0; targetData[i + 2] = 128;
    } else {
      targetData[i] = luma; targetData[i + 1] = luma; targetData[i + 2] = luma;
    }
    targetData[i + 3] = raw[i + 3];
  }

  ctx.putImageData(imgData, 0, 0);
}

function toggleFalseColorMode() {
  if (!primaryImageData) return;

  const fcCanvas = document.getElementById("falseColorCanvas");
  if (!fcCanvas) return;

  isFalseColorActive = !isFalseColorActive;

  if (isFalseColorActive) {
    fcCanvas.classList.remove("hidden");
  } else {
    fcCanvas.classList.add("hidden");
  }

  const btn = document.getElementById("toggleFalseColor");
  if (btn) {
    btn.className = `px-3 py-1.5 ${isFalseColorActive ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-300'} hover:bg-cyan-600 rounded-lg text-xs font-semibold border border-gray-700 transition`;
    btn.innerText = isFalseColorActive ? "🎨 Disable Exposure Map" : "🎨 Toggle Visual Exposure Map";
  }
}

// ==========================================
// 6. FAST VECTORSCOPE DISPLAY
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
// 7. SOFTWARE-ADAPTIVE 3-WAY GUIDANCE ENGINE
// ==========================================
function runAppOnScreenGuidance() {
  const feedback = document.getElementById("critiqueFeedback");
  const badge = document.getElementById("exposureStatusBadge");
  if (!feedback || !primaryImageData) return;

  const pData = primaryImageData.rawData;
  let pLumaSum = 0, rSum = 0, gSum = 0, bSum = 0;
  const sampleStep = 16;
  const sampleCount = pData.length / sampleStep;

  for (let i = 0; i < pData.length; i += sampleStep) {
    rSum += pData[i]; gSum += pData[i + 1]; bSum += pData[i + 2];
    pLumaSum += (0.2126 * pData[i] + 0.7152 * pData[i + 1] + 0.0722 * pData[i + 2]);
  }

  const pAvgLuma = pLumaSum / sampleCount;
  let cards = [];

  // Software Vocabulary Dictionary
  const swNames = {
    davinci: { layer: "Node 1", midtone: "Gamma Wheel", shadow: "Lift Wheel", targetLayer: "Node 2 & 3" },
    premiere: { layer: "Lumetri - Basic Correction", midtone: "Midtones Wheel", shadow: "Shadows Wheel", targetLayer: "Lumetri Color Panel" },
    lightroom: { layer: "Basic Panel", midtone: "Midtones / Exposure", shadow: "Shadows Slider", targetLayer: "Color Grading Panel" },
    capcut: { layer: "Adjust Tab", midtone: "Brightness / Highlights", shadow: "Shadows", targetLayer: "Filters / Adjustments" }
  };
  const sw = swNames[selectedSoftware] || swNames.davinci;

  // 1. UNDEREXPOSED CHECK (pAvgLuma < 45)
  if (pAvgLuma < 45) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800";
      badge.innerText = "Underexposed / Too Dark";
    }

    cards.push(`
      <div class="bg-red-950/40 border border-red-500/40 p-3 rounded-lg space-y-1.5">
        <p class="font-bold text-red-300 text-xs flex items-center gap-1.5">
          <span>🌑</span> CRITICAL RECOVERY: SHOT IS TOO DARK (In ${sw.layer})
        </p>
        <p class="text-red-200/90 text-xs leading-relaxed">
          Details in your landscape and buildings are buried in deep shadows. Perform these 3 recovery moves first:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <div class="bg-black/40 p-2 rounded border border-red-500/20 text-[11px]">
            <strong class="text-red-400 block">1. Exposure / Offset:</strong> Boost (+0.80 to +1.50) to bring back details.
          </div>
          <div class="bg-black/40 p-2 rounded border border-red-500/20 text-[11px]">
            <strong class="text-red-400 block">2. Shadows / Gamma:</strong> Lift midtones so dark areas become visible.
          </div>
          <div class="bg-black/40 p-2 rounded border border-red-500/20 text-[11px]">
            <strong class="text-red-400 block">3. Contrast:</strong> Ease off contrast slightly so shadows aren't crushed.
          </div>
        </div>
      </div>
    `);
  } 
  // 2. OVEREXPOSURE CHECK (pAvgLuma > 110)
  else if (pAvgLuma > 110) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800";
      badge.innerText = "Overexposed & Flushed Details";
    }

    cards.push(`
      <div class="bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg space-y-1.5">
        <p class="font-bold text-amber-300 text-xs flex items-center gap-1.5">
          <span>⚠️</span> RECOVERY STEP (In ${sw.layer}):
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <div class="bg-black/40 p-2 rounded border border-amber-500/20 text-[11px]">
            <strong class="text-amber-400 block">1. Highlights:</strong> Pull down to -70 to reveal flushed details.
          </div>
          <div class="bg-black/40 p-2 rounded border border-amber-500/20 text-[11px]">
            <strong class="text-amber-400 block">2. Shadows:</strong> Lower down until blacks look rich.
          </div>
          <div class="bg-black/40 p-2 rounded border border-amber-500/20 text-[11px]">
            <strong class="text-amber-400 block">3. Saturation:</strong> Turn up to +20 to restore dead colors.
          </div>
        </div>
      </div>
    `);
  } 
  // 3. PROPERLY BALANCED (45 <= pAvgLuma <= 110)
  else {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800";
      badge.innerText = "Exposure Well Balanced";
    }
  }

  let targetLuma = 100;
  let targetMoodName = "Standard Balance";
  let targetWarmth = 0;

  if (referenceImageData) {
    const rData = referenceImageData.imageData.data;
    let rLumaSum = 0, rRedSum = 0, rBlueSum = 0;
    const rSampleCount = rData.length / sampleStep;

    for (let i = 0; i < rData.length; i += sampleStep) {
      rRedSum += rData[i]; rBlueSum += rData[i + 2];
      rLumaSum += (0.2126 * rData[i] + 0.7152 * rData[i + 1] + 0.0722 * rData[i + 2]);
    }
    targetLuma = rLumaSum / rSampleCount;
    targetWarmth = (rRedSum - rBlueSum) / rSampleCount;
    targetMoodName = "Target Reference Frame";
  } else if (activePreset && MOOD_PRESETS[activePreset]) {
    const p = MOOD_PRESETS[activePreset];
    targetLuma = p.lumaTarget;
    targetWarmth = p.warmBias;
    targetMoodName = p.name;
  }

  const lumaDiff = targetLuma - pAvgLuma;
  let exposureStepText = "";
  if (lumaDiff < -15) {
    exposureStepText = `Target <strong>${targetMoodName}</strong> is moodier. Reduce Exposure (-0.40) and lower shadows.`;
  } else if (lumaDiff > 15) {
    exposureStepText = `Target is brighter. Lift Exposure/Midtones (+0.80 to +1.20).`;
  } else {
    exposureStepText = `Exposure matches target <strong>${targetMoodName}</strong>.`;
  }

  let colorStepText = "";
  if (targetWarmth > 10) {
    colorStepText = `Nudge your ${sw.midtone} toward <strong>Warm Amber/Orange</strong>.`;
  } else if (targetWarmth < -10) {
    colorStepText = `Push your ${sw.shadow} toward <strong>Cool Teal/Blue</strong>.`;
  } else {
    colorStepText = `Color temperature is balanced.`;
  }

  cards.push(`
    <div class="bg-gray-900/90 border border-gray-800 p-3 rounded-lg space-y-2">
      <p class="font-bold text-cyan-400 text-xs">🎯 MOOD & COLOR MATCHING STEPS (In ${sw.targetLayer}):</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <div class="bg-black/40 p-2 rounded border border-gray-800">
          <strong class="text-cyan-300 block">Exposure Adjustment:</strong> ${exposureStepText}
        </div>
        <div class="bg-black/40 p-2 rounded border border-gray-800">
          <strong class="text-cyan-300 block">Color Shifts:</strong> ${colorStepText}
        </div>
      </div>
    </div>
  `);

  cards.push(`
    <div class="bg-purple-950/30 border border-purple-500/30 p-3 rounded-lg flex justify-between items-center text-xs">
      <div>
        <strong class="text-purple-300 block">🚀 1-Click Fast Track:</strong>
        <span class="text-purple-200/80 text-[11px]">Click 'Export 3D .CUBE LUT' at the top and drop the downloaded file into your project.</span>
      </div>
    </div>
  `);

  feedback.innerHTML = cards.join("");
}

// ==========================================
// 8. 3D .CUBE LUT EXPORT ENGINE
// ==========================================
function export3DLUT() {
  if (!primaryImageData) {
    alert("Please upload an image first to generate a 3D LUT!");
    return;
  }

  const lutSize = 17;
  const lines = [`# Color Director Generated 3D LUT`, `LUT_3D_SIZE ${lutSize}`, ``];

  const pData = primaryImageData.rawData;
  let rSum = 0, gSum = 0, bSum = 0;
  const count = pData.length / 16;
  
  for (let i = 0; i < pData.length; i += 16) {
    rSum += pData[i]; gSum += pData[i + 1]; bSum += pData[i + 2];
  }
  
  const rMult = (rSum / count) / 128;
  const gMult = (gSum / count) / 128;
  const bMult = (bSum / count) / 128;

  for (let b = 0; b < lutSize; b++) {
    for (let g = 0; g < lutSize; g++) {
      for (let r = 0; r < lutSize; r++) {
        const rIn = r / (lutSize - 1);
        const gIn = g / (lutSize - 1);
        const bIn = b / (lutSize - 1);

        const rOut = Math.min(1.0, Math.max(0.0, rIn * (1.1 - (rMult - 1.0)))).toFixed(6);
        const gOut = Math.min(1.0, Math.max(0.0, gIn * (1.1 - (gMult - 1.0)))).toFixed(6);
        const bOut = Math.min(1.0, Math.max(0.0, bIn * (1.1 - (bMult - 1.0)))).toFixed(6);

        lines.push(`${rOut} ${gOut} ${bOut}`);
      }
    }
  }

  const blob = new Blob([lines.join('\n')], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Color_Director_Grade.cube";
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
