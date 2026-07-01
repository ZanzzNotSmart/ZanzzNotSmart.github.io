// ============================================================================
// NEXUS — main.js
// Entry point aplikasi. Merangkai seluruh modul (scene, camera, controls,
// loader, animation, ui, effects) dan menjalankan render loop.
//
// Catatan perbaikan foundation:
// - Seluruh inisialisasi dibungkus di dalam bootstrap() yang baru dipanggil
//   setelah DOM benar-benar siap (DOMContentLoaded), meski secara teknis
//   <script type="module"> sudah otomatis deferred. Ini eksplisit demi
//   memastikan "semua element UI dibuat sebelum JavaScript dijalankan".
// - Setiap akses DOM dicek null terlebih dahulu.
// - try/catch + global error handler memastikan satu kegagalan kecil
//   (misalnya WebGL tidak didukung) tidak membuat seluruh halaman rusak
//   atau loader tersangkut selamanya.
// ============================================================================

import * as THREE from 'three';

import { createScene } from './scene.js';
import { createCamera, updateCameraOnResize } from './camera.js';
import { createControls } from './controls.js';
import { createLoadingManager } from './loader.js';
import { configureGsapDefaults, playIntroTimeline } from './animation.js';
import { initUI, hideLoader } from './ui.js';
import { initEffects } from './effects.js';

/**
 * Bootstrap seluruh aplikasi. Dipanggil sekali setelah DOM siap.
 */
function bootstrap() {
  // ---------------------------------------------------------------------
  // 1. Setup dasar: canvas, renderer, scene, camera, controls
  // ---------------------------------------------------------------------

  const canvas = document.querySelector('#nexus-canvas');

  if (!canvas) {
    // Tanpa canvas, WebGLRenderer tidak bisa dibuat dengan benar.
    // Hentikan setup 3D secara aman (bukan crash), tapi tetap jalankan UI
    // non-3D (tombol, loader) supaya halaman tetap fungsional.
    console.error('[NEXUS] Elemen #nexus-canvas tidak ditemukan di DOM. Setup Three.js dilewati.');
    safeInitNonThreeParts();
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // latar transparan supaya gradient CSS di belakang canvas terlihat
    });
  } catch (err) {
    console.error('[NEXUS] Gagal membuat WebGLRenderer (kemungkinan WebGL tidak didukung):', err);
    safeInitNonThreeParts();
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = createScene();
  const camera = createCamera(window.innerWidth / window.innerHeight);
  const controls = createControls(camera, renderer.domElement);

  // LoadingManager disiapkan meski belum ada aset yang dimuat — begitu
  // prompt berikutnya menambahkan model/tekstur, tinggal pakai `manager` ini.
  createLoadingManager({
    onLoad: () => hideLoader(),
  });

  // Belum ada aset untuk dimuat pada tahap ini, jadi loader disembunyikan
  // langsung setelah scene siap dirender.
  hideLoader(300);

  initEffects({ scene, camera, renderer });

  // ---------------------------------------------------------------------
  // 2. Resize handler — menjaga canvas & kamera tetap sinkron dengan viewport
  // ---------------------------------------------------------------------

  function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    updateCameraOnResize(camera, width, height);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  window.addEventListener('resize', onResize);

  // ---------------------------------------------------------------------
  // 3. Animation loop
  // ---------------------------------------------------------------------

  function animate() {
    requestAnimationFrame(animate);

    controls.update(); // wajib dipanggil setiap frame karena enableDamping aktif

    renderer.render(scene, camera);
  }

  // ---------------------------------------------------------------------
  // 4. Inisialisasi UI & GSAP, lalu mulai loop
  // ---------------------------------------------------------------------

  safeInitNonThreeParts();
  animate();
}

/**
 * Inisialisasi bagian non-Three.js (GSAP + UI). Dipisah agar tetap bisa
 * dijalankan walau setup Three.js gagal (mis. WebGL tidak didukung),
 * sehingga tombol & loader tetap berfungsi.
 */
function safeInitNonThreeParts() {
  try {
    configureGsapDefaults();
  } catch (err) {
    console.error('[NEXUS] Gagal mengonfigurasi GSAP defaults:', err);
  }

  try {
    initUI();
  } catch (err) {
    console.error('[NEXUS] Gagal inisialisasi UI:', err);
  }

  try {
    playIntroTimeline();
  } catch (err) {
    console.error('[NEXUS] Gagal menjalankan intro timeline GSAP:', err);
  }

  // Jaring pengaman terakhir: apa pun yang terjadi, loader tidak boleh
  // tersangkut menutupi layar selamanya.
  hideLoader(800);
}

// ----------------------------------------------------------------------------
// Jaring pengaman global: catat error tak terduga ke console dengan jelas
// dan pastikan loading screen tidak tersangkut jika terjadi error di luar
// blok try/catch manapun.
// ----------------------------------------------------------------------------
window.addEventListener('error', (event) => {
  console.error('[NEXUS] Unhandled error:', event.error || event.message);
  hideLoader(0);
});

// ----------------------------------------------------------------------------
// Jalankan bootstrap setelah DOM benar-benar siap. Modul ES sudah otomatis
// deferred, tapi pengecekan ini eksplisit sesuai requirement:
// "pastikan semua element UI dibuat sebelum JavaScript dijalankan".
// ----------------------------------------------------------------------------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
