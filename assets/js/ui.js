// ============================================================================
// NEXUS — ui.js
// Menangani interaksi antarmuka non-3D: loading screen, tombol,
// dan elemen dekoratif (label koordinat di navbar).
//
// Semua akses DOM di file ini WAJIB melalui safeQuery() agar setiap
// pemanggil otomatis mendapat null-check dan log peringatan yang jelas
// di console jika elemen tidak ditemukan — tidak pernah langsung
// melempar TypeError seperti "Cannot set properties of null".
// ============================================================================

/**
 * Wrapper aman untuk document.querySelector.
 * Mengembalikan elemen jika ditemukan, atau null + console.warn jika tidak.
 * @param {string} selector
 * @returns {Element|null}
 */
function safeQuery(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`[NEXUS] Elemen dengan selector "${selector}" tidak ditemukan di DOM.`);
  }
  return el;
}

/**
 * Menyembunyikan loading screen setelah aplikasi siap.
 * @param {number} delay - jeda dalam ms sebelum loader disembunyikan
 */
export function hideLoader(delay = 400) {
  const loader = safeQuery('.nexus-loader');
  if (!loader) return;

  window.setTimeout(() => {
    loader.classList.add('is-hidden');
  }, delay);
}

/**
 * Menghubungkan tombol "Explore Portfolio" ke aksi placeholder.
 * Saat ini hanya scroll halus (belum ada section tujuan — disiapkan
 * untuk prompt berikutnya ketika section baru ditambahkan).
 */
export function bindExploreButton() {
  const button = safeQuery('[data-action="explore"]');
  if (!button) return;

  button.addEventListener('click', () => {
    console.info('[NEXUS] Explore Portfolio diklik — section berikutnya belum tersedia.');
    // Placeholder: nanti akan scroll ke section portfolio.
    const target = document.querySelector('#work');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/**
 * Memperbarui label koordinat dekoratif di navbar mengikuti posisi kursor.
 * Sekadar sentuhan premium yang menegaskan tema "3D / spatial".
 */
export function bindCoordinateLabel() {
  const coordsEl = safeQuery('[data-coords]');
  if (!coordsEl) return;

  window.addEventListener('pointermove', (event) => {
    // Guard tambahan: elemen bisa saja dihapus dari DOM secara dinamis
    // di masa depan (mis. responsive re-render), jadi dicek ulang di sini.
    if (!coordsEl.isConnected) return;

    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    coordsEl.textContent = `X ${x.toString().padStart(2, '0')} · Y ${y.toString().padStart(2, '0')}`;
  });
}

/**
 * Inisialisasi seluruh binding UI. Dipanggil dari main.js.
 * Setiap binding dibungkus try/catch individual agar satu kegagalan
 * tidak menghentikan binding UI lainnya.
 */
export function initUI() {
  const bindings = [bindExploreButton, bindCoordinateLabel];

  bindings.forEach((bind) => {
    try {
      bind();
    } catch (err) {
      console.error(`[NEXUS] Gagal menjalankan ${bind.name}:`, err);
    }
  });
}
