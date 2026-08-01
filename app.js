// ==========================================
// 1. APP STATE & GUIDED STEPS
// ==========================================
const STEPS = [
  {
    title: "1. Exposure & Detail Recovery",
    instruction: "Upload your shot. If details are flushed/washed out, follow the initial recovery steps first.",
    action: "Exposure Assessment"
  },
  {
    title: "2. Color Mood & Skin Tone Calibration",
    instruction: "Choose a target Mood Preset OR upload a reference image to get exact color guidance.",
    action: "Mood Calibration"
  },
  {
    title: "3. Export Grade for DaVinci / Premiere / Lightroom",
    instruction: "Follow the plain-English slider steps or click 'Export 3D .CUBE LUT' to apply the grade.",
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
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold text-cyan-400">${step.title}</h1>
          <p class="text-xs text-gray-400 mt-0.5">${step.instruction}</p>
        </div>
        <span class="bg-cyan-950 text-cyan-300 text-xs px-3 py-1 rounded-full font-bold">
          ${step.action}
        </span>
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

      <!-- Creator Presets -->
      <div class="bg-gray-950/60 p-3 rounded-xl border border-gray-800 space-y-2">
        <p class="text-xs font-bold text-gray-400">OR SELECT A MOOD PRESET:</p>
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
          🎨 ${isFalseColorActive ? 'Disable Visual Exposure Map' : 'Toggle Visual Exposure Map'}
        </button>

        <button id="exportLUT" class="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-semibold border border-purple-500/30 transition">
          💾 Export 3D .CUBE LUT (DaVinci/Premiere)
        </button>
      </div>

      <!-- Preview Displays -->
      <div id="previewContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center">
          <p class="text-xs text-gray-400 mb-2 font-semibold">YOUR SHOT</p>
          <canvas id="primaryCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center">
          <p class="text-xs text-purple-400 mb-2 font-semibold">TARGET REFERENCE</p>
          <canvas id="refCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg"></canvas>
        </div>

        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center">
          <p class="text-xs text-cyan-400 mb-2 font-semibold">COLOR DISTRIBUTION</p>
          <canvas id="vectorscopeCanvas" width="180" height="180" class="w-[180px] h-[180px] bg-gray-950 rounded-full border border-gray-800"></canvas>
        </div>
      </div>

      <!-- Real-World Creator Assistant Box -->
      <div id="critiqueBox" class="bg-gray-950 border border-cyan-500/30 p-4 rounded-xl text-xs space-y-3">
        <p class="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
          <span>👑</span> GOAT Workflow Directives:
        </p>
        <div id="critiqueFeedback" class="text-gray-300 space-y-2 leading-relaxed">
          Upload a shot above to detect exposure issues and get step-by-step recovery steps.
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

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) prevBtn.onclick = () => { if (currentStep > 0) { currentStep--; requestAnimationFrame(renderApp); } };
  if (nextBtn) nextBtn.onclick = () => { if (currentStep < STEPS.length - 1) { currentStep++; requestAnimationFrame(renderApp); } };
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
// 4. IMAGE PROCESSING ENGINE
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

      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      if (type === 'primary') {
        primaryImageData = { img, imageData, rawData: new Uint8ClampedArray(imageData.data) };
        isFalseColorActive = false;
        drawVectorscope(imageData);
      } else {
        referenceImageData = { img, imageData };
        activePreset = null;
      }

      runHumanAnalysis();
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
      canvas.width = primaryImageData.img.width;
      canvas.height = primaryImageData.img.height;
      
      if (isFalseColorActive) {
        applyFalseColorToCanvas(ctx, canvas.width, canvas.height);
      } else {
        ctx.putImageData(primaryImageData.imageData, 0, 0);
      }
      drawVectorscope(primaryImageData.imageData);
    }
  }

  if (referenceImageData) {
    const refCanvas = document.getElementById('refCanvas');
    if (refCanvas) {
      const ctx = refCanvas.getContext("2d");
      refCanvas.width = referenceImageData.img.width;
      refCanvas.height = referenceImageData.img.height;
      ctx.putImageData(referenceImageData.imageData, 0, 0);
    }
  }

  if (primaryImageData) runHumanAnalysis();
}

// ==========================================
// 5. VISUAL EXPOSURE MAP ENGINE
// ==========================================
function toggleFalseColorMode() {
  if (!primaryImageData) return;

  const canvas = document.getElementById("primaryCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  isFalseColorActive = !isFalseColorActive;

  if (isFalseColorActive) {
    applyFalseColorToCanvas(ctx, canvas.width, canvas.height);
  } else {
    ctx.putImageData(primaryImageData.imageData, 0, 0);
  }

  const btn = document.getElementById("toggleFalseColor");
  if (btn) {
    btn.className = `px-3 py-1.5 ${isFalseColorActive ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-300'} hover:bg-cyan-600 rounded-lg text-xs font-semibold border border-gray-700 transition`;
    btn.innerText = isFalseColorActive ? "🎨 Disable Visual Exposure Map" : "🎨 Toggle Visual Exposure Map";
  }
}

function applyFalseColorToCanvas(ctx, width, height) {
  const imgData = ctx.createImageData(width, height);
  const targetData = imgData.data;
  const raw = primaryImageData.rawData;

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luma >= 250) {
      targetData[i] = 255; targetData[i + 1] = 0; targetData[i + 2] = 0;
    } else if (luma >= 100 && luma <= 115) {
      targetData[i] = 255; targetData[i + 1] = 105; targetData[i + 2] = 180;
    } else if (luma >= 40 && luma <= 48) {
      targetData[i] = 0; targetData[i + 1] = 255; targetData[i + 2] = 0;
    } else if (luma <= 10) {
      targetData[i] = 128; targetData[i + 1] = 0; targetData[i + 2] = 128;
    } else {
      targetData[i] = luma; targetData[i + 1] = luma; targetData[i + 2] = luma;
    }
    targetData[i + 3] = raw[i + 3];
  }

  ctx.putImageData(imgData, 0, 0);
}

// ==========================================
// 6. VECTORSCOPE DISPLAY
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
  const step = Math.max(4, Math.floor((pixels.length / 4) / 15000)) * 4;
  ctx.fillStyle = "rgba(6, 182, 212, 0.35)";

  for (let i = 0; i < pixels.length; i += step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
    const v = 0.615 * r - 0.51499 * g - 0.10001 * b;

    const x = center + (u * (radius / 128));
    const y = center - (v * (radius / 128));

    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

// ==========================================
// 7. GOAT WORKFLOW ANALYSIS ENGINE
// ==========================================
function runHumanAnalysis() {
  const feedback = document.getElementById("critiqueFeedback");
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
  let steps = [];

  // OVEREXPOSURE & WASHED OUT DETECTION (Luma > 110)
  if (pAvgLuma > 110) {
    steps.push(`⚠️ <strong>CRITICAL RECOVERY NEEDED (Shot is Overexposed):</strong><br/>
    Before applying any LUT or creative color, do these initial steps in Node 1 in DaVinci:
    <ul class="list-disc pl-4 mt-1 space-y-1 text-gray-300">
      <li><strong>Pull Highlights Down (-60 to -80):</strong> Brings back flushed details in bright areas.</li>
      <li><strong>Crush Lift / Shadows Down:</strong> Lowers dark areas to true black to restore washed-out contrast.</li>
      <li><strong>Boost Saturation (+15) & Color Boost (+20):</strong> Restores dead, pale skin/object colors safely.</li>
    </ul>`);
  }

  // Determine Target (from Reference image OR Preset)
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

  // Exposure Guidance for Grade
  const lumaDiff = targetLuma - pAvgLuma;
  if (lumaDiff < -15) {
    steps.push(`☀️ <strong>Node 2 (Exposure Matching):</strong> Target <em>${targetMoodName}</em> is moodier. Turn EXPOSURE down (-0.40 to -0.70).`);
  } else if (lumaDiff > 15) {
    steps.push(`🔆 <strong>Node 2 (Exposure Matching):</strong> Target is brighter. Lift midtones slightly.`);
  }

  // Color Balance Guidance
  if (targetWarmth > 10) {
    steps.push(`🔥 <strong>Node 3 (Color Look):</strong> Nudge midtone wheel toward <strong>Warm Amber/Orange</strong>.`);
  } else if (targetWarmth < -10) {
    steps.push(`❄️ <strong>Node 3 (Color Look):</strong> Push shadow wheel toward <strong>Teal/Cool Blue</strong>.`);
  }

  steps.push(`💡 <strong>Final Polish (Node 4):</strong> Export the LUT above, place it on Node 3, then add a subtle vignette to make your subject pop like a GOAT!`);

  feedback.innerHTML = steps.map(item => `<div class="bg-gray-900 p-2.5 rounded-lg border border-gray-800">${item}</div>`).join("");
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
