const VirtualMachine = require('scratch-vm');
const Storage = require('scratch-storage');
const RenderWebGL = require('scratch-render');
const AudioEngine = require('scratch-audio');
const { BitmapAdapter } = require('scratch-svg-renderer');

const ASSET_SERVER = 'https://assets.scratch.mit.edu/';
const PROJECT_SERVER = 'https://projects.scratch.mit.edu/';
const INTERNAL_ASSET_PATH = 'internalapi/asset/';

/**
 * This is pulled from scratch-vm/playground/benchmark.js
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
function getProjectUrl(asset) {
  const assetIdParts = asset.assetId.split('.');
  const assetUrlParts = [PROJECT_SERVER, assetIdParts[0]];
  if (assetIdParts[1]) {
    assetUrlParts.push(assetIdParts[1]);
  }
  return assetUrlParts.join('');
}

/**
 * This is pulled from scratch-vm/playground/benchmark.js
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
function getAssetUrl(asset) {
  const assetUrlParts = [
    ASSET_SERVER,
    INTERNAL_ASSET_PATH,
    asset.assetId,
    '.',
    asset.dataFormat || asset.assetType.runtimeFormat,
    '/get/'
  ];
  return assetUrlParts.join('');
}

const Scratch = {};

const loadProject = function () {
  Scratch.vm.downloadProjectId('10128067');
};

window.onload = function () {
  // Lots of global variables to make debugging easier
  // Instantiate the VM.

  const vm = new VirtualMachine();
  Scratch.vm = vm;
  Scratch.vm.attachV2BitmapAdapter(new BitmapAdapter());

  const storage = new Storage();
  const AssetType = storage.AssetType;
  storage.addWebStore([AssetType.Project], getProjectUrl);
  storage.addWebStore([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
  vm.attachStorage(storage);

  loadProject();

  vm.on('workspaceUpdate', () => {
    console.log('workspaceUpdate');
    setTimeout(() => vm.greenFlag(), 1000);
  });

  // Instantiate the renderer and connect it to the VM.
  const canvas = document.getElementById('scratch-stage');
  const renderer = new RenderWebGL(canvas);
  Scratch.renderer = renderer;
  vm.attachRenderer(renderer);
  const audioEngine = new AudioEngine();
  vm.attachAudioEngine(audioEngine);

  // Feed mouse events as VM I/O events.
  document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const coordinates = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', coordinates);
  });
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const data = {
      isDown: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', data);
    e.preventDefault();
  });
  canvas.addEventListener('mouseup', e => {
    const rect = canvas.getBoundingClientRect();
    const data = {
      isDown: false,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', data);
    e.preventDefault();
  });

  // Feed keyboard events as VM I/O events.
  document.addEventListener('keydown', e => {
    // Don't capture keys intended for Blockly inputs.
    if (e.target !== document && e.target !== document.body) {
      return;
    }
    Scratch.vm.postIOData('keyboard', {
      key: e.keyCode,
      isDown: true
    });
    e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    // Always capture up events,
    // even those that have switched to other targets.
    Scratch.vm.postIOData('keyboard', {
      key: e.keyCode,
      isDown: false
    });
    // E.g., prevent scroll.
    if (e.target !== document && e.target !== document.body) {
      e.preventDefault();
    }
  });

  // Run threads
  console.log('start');
  vm.start();

  console.log('greenFlag');
  vm.greenFlag();
};
