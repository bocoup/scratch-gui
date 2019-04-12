import VirtualMachine from 'scratch-vm';
import RenderWebGL from 'scratch-render';
import AudioEngine from 'scratch-audio';
import {BitmapAdapter} from 'scratch-svg-renderer';
import storage from '../lib/storage';

// This file is an example of how to create a standalone, full screen
// minimal scratch player without the editor view.

const EXAMPLE_PROJECT = 289970867; // Mario

window.onload = function () {

    // Instantiate the VM.
    const vm = new VirtualMachine();
    vm.attachV2BitmapAdapter(new BitmapAdapter());

    // Initialize storage
    storage.addOfficialScratchWebStores();
    vm.attachStorage(storage);

    vm.downloadProjectId(EXAMPLE_PROJECT);

    vm.on('workspaceUpdate', () => {
        setTimeout(() => vm.greenFlag(), 1000);
    });

    // Instantiate the renderer and connect it to the VM.
    const canvas = document.getElementById('scratch-stage');
    const renderer = new RenderWebGL(canvas);
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
        vm.postIOData('mouse', coordinates);
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
        vm.postIOData('mouse', data);
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
        vm.postIOData('mouse', data);
        e.preventDefault();
    });

    // Feed keyboard events as VM I/O events.
    document.addEventListener('keydown', e => {
        // Don't capture keys intended for Blockly inputs.
        if (e.target !== document && e.target !== document.body) {
            return;
        }
        vm.postIOData('keyboard', {
            key: e.keyCode,
            isDown: true
        });
        e.preventDefault();
    });
    document.addEventListener('keyup', e => {
        // Always capture up events,
        // even those that have switched to other targets.
        vm.postIOData('keyboard', {
            key: e.keyCode,
            isDown: false
        });
        // E.g., prevent scroll.
        if (e.target !== document && e.target !== document.body) {
            e.preventDefault();
        }
    });

    // Run threads
    vm.start();

    vm.greenFlag();
};
