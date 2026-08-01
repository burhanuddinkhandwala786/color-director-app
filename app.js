// Step 1: Guided Instructions for Beginners
const STEPS = [
  {
    title: "1. Organize Your Workspace",
    instruction: "Drag & Drop your photo or video into the box below.",
    action: "Drag & Drop",
    tip: "In DaVinci Resolve or Premiere: Make sure your clip is imported into your timeline first!"
  },
  {
    title: "2. Check Your Exposure (Scopes)",
    instruction: "Look at your highlights and shadows. Are the shadows too dark?",
    action: "Observe",
    tip: "In Premiere Pro: Open Window > Lumetri Scopes > Waveform."
  },
  {
    title: "3. Make It Pop!",
    instruction: "Lift the midtones slightly to bring focus to your subject's face.",
    action: "Adjust Wheels",
    tip: "Lift = Shadows, Gamma = Midtones, Gain = Highlights."
  }
];

let currentStep = 0;

function renderApp() {
  const root = document.getElementById("root");
  const step = STEPS[currentStep];

  root.innerHTML = `
    <div class="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold text-cyan-400">${step.title}</h1>
        <span class="bg-cyan-950 text-cyan-300 text-xs px-3 py-1 rounded-full font-bold">
          ${step.action}
        </span>
      </div>

      <!-- Drag and Drop Dropzone -->
      <div 
        id="dropzone"
        class="border-2 border-dashed border-gray-700 hover:border-cyan-400 rounded-xl p-8 text-center transition-colors cursor-pointer mb-4"
      >
        <p class="text-sm text-gray-400">📁 Drag & Drop your Image/Video file right here</p>
        <p class="text-xs text-gray-600 mt-1">(Files stay 100% on your device - $0 server costs!)</p>
      </div>

      <p class="text-base text-gray-200 mb-4">${step.instruction}</p>

      <div class="bg-gray-800/80 border-l-4 border-cyan-500 p-3 rounded text-xs text-gray-300 mb-6">
        💡 <strong>Colorist Tip:</strong> ${step.tip}
      </div>

      <div class="flex justify-between">
        <button 
          id="prevBtn" 
          ${currentStep === 0 ? 'disabled' : ''} 
          class="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-700"
        >
          Previous
        </button>
        <button 
          id="nextBtn" 
          ${currentStep === STEPS.length - 1 ? 'disabled' : ''} 
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold text-white disabled:opacity-30"
        >
          Next Step
        </button>
      </div>
    </div>
  `;

  // Attach button click handlers
  document.getElementById("prevBtn").onclick = () => {
    if (currentStep > 0) { currentStep--; renderApp(); }
  };
  document.getElementById("nextBtn").onclick = () => {
    if (currentStep < STEPS.length - 1) { currentStep++; renderApp(); }
  };
}

// Start the app!
try {
  renderApp();
} catch (err) {
  // 🛡️ Self-Healing Failsafe: If anything breaks, show recovery screen
  document.getElementById("root").innerHTML = `
    <div class="p-4 bg-red-950/50 border border-red-500 rounded-xl text-center">
      <p class="text-red-400 font-bold text-sm">Something went wrong!</p>
      <button onclick="location.reload()" class="mt-2 text-xs bg-red-600 px-3 py-1 rounded text-white">
        Reset App
      </button>
    </div>
  `;
}