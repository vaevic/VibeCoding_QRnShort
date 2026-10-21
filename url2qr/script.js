/**
 * QR Craft - Core Script
 * 
 * 1. 화면 상단 좌측 로고 (img/logo.png)
 * 2. 화면 중앙 심플한 URL 입력창
 * 3. URL 입력 후 확인 시: URL창이 하단으로 부드럽게 내려가고 정중앙에 QR코드 생성
 * 4. QR코드 클릭 시: 선명한 JPG 파일로 즉시 다운로드
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const mainWrapper = document.getElementById('main-wrapper');
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const btnClearInput = document.getElementById('btn-clear-input');
  
  const qrCard = document.getElementById('qr-card');
  const qrCanvasWrapper = document.getElementById('qr-canvas-wrapper');
  const qrMount = document.getElementById('qrcode-mount');
  const qrTargetPreview = document.getElementById('qr-target-preview');
  
  const btnDownloadJpg = document.getElementById('btn-download-jpg');
  const btnCopyUrl = document.getElementById('btn-copy-url');
  const btnResetView = document.getElementById('btn-reset-view');
  const brandHome = document.getElementById('brand-home');
  const toastContainer = document.getElementById('toast-container');

  let currentUrl = '';
  let qrCodeInstance = null;
  let highResJpgDataUrl = null;

  // Initial focus
  urlInput.focus();

  // Show / Hide clear input button
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      btnClearInput.classList.add('visible');
    } else {
      btnClearInput.classList.remove('visible');
    }
  });

  btnClearInput.addEventListener('click', () => {
    urlInput.value = '';
    btnClearInput.classList.remove('visible');
    urlInput.focus();
  });

  // Handle URL Form Submission
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawUrl = urlInput.value.trim();

    if (!rawUrl) {
      showToast('URL 주소를 입력해주세요.', 'error');
      urlInput.focus();
      return;
    }

    // Auto-fix URL scheme if user just types "example.com" or "naver.com"
    let formattedUrl = rawUrl;
    if (!/^https?:\/\//i.test(formattedUrl) && /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    currentUrl = formattedUrl;
    await renderQRCode(currentUrl);
  });

  /**
   * Render QR Code using QRCode.js and generate JPG data url
   */
  async function renderQRCode(text) {
    try {
      // Clear previous QR mount
      qrMount.innerHTML = '';
      highResJpgDataUrl = null;

      const size = 300; // Crisp preview and download size

      if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(qrMount, {
          text: text,
          width: size,
          height: size,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });

        // QRCode library draws asynchronously to either a canvas or img tag
        // Give a short tick for DOM update, then construct the white-background JPG
        setTimeout(() => {
          extractJpgFromMount(size);
        }, 120);

      } else {
        showToast('QR 코드 라이브러리를 초기화하지 못했습니다.', 'error');
        return;
      }

      // Update Preview URL text
      qrTargetPreview.textContent = text;
      qrTargetPreview.title = text;

      // Animate: Move input to bottom dock, reveal center QR code
      mainWrapper.classList.add('has-result');

      showToast('QR 코드가 생성되었습니다! 클릭하여 JPG로 저장하세요.', 'success');

    } catch (err) {
      console.error('Failed to generate QR code:', err);
      showToast('QR 코드 생성 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * Ensure pure white background and extract high-quality JPG Data URL
   */
  function extractJpgFromMount(size) {
    const canvas = qrMount.querySelector('canvas');
    const img = qrMount.querySelector('img');

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 600; // 2x high resolution for clean printing / viewing
    exportCanvas.height = 600;
    const ctx = exportCanvas.getContext('2d');

    // Fill white background (ensures JPG doesn't turn black due to transparency)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 600);

    if (canvas && img) {
      img.style.display = 'none';
    }

    if (canvas) {
      // Draw canvas scaled onto export canvas with nice white margin
      const padding = 30;
      ctx.drawImage(canvas, padding, padding, 600 - (padding * 2), 600 - (padding * 2));
      highResJpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
    } else if (img && img.src) {
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.onload = () => {
        const padding = 30;
        ctx.drawImage(tempImg, padding, padding, 600 - (padding * 2), 600 - (padding * 2));
        highResJpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
      };
      tempImg.src = img.src;
    }
  }

  /**
   * Trigger JPG download
   */
  function downloadJpg() {
    if (!highResJpgDataUrl) {
      // If not yet ready, try extracting immediately
      extractJpgFromMount(300);
      if (!highResJpgDataUrl) {
        showToast('QR 코드 이미지를 준비하는 중입니다. 잠시 후 다시 클릭해주세요.', 'info');
        return;
      }
    }

    // Build friendly filename with domain & timestamp
    let hostname = 'qrcode';
    try {
      const parsed = new URL(currentUrl);
      hostname = parsed.hostname.replace(/[^a-zA-Z0-9]/g, '_');
    } catch (_) {
      hostname = 'qrcode';
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `QR_${hostname}_${timestamp}.jpg`;

    // Trigger download via anchor
    const link = document.createElement('a');
    link.href = highResJpgDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`"${filename}" 파일로 다운로드되었습니다!`, 'success');
  }

  // 1) Clicking the QR Code itself triggers JPG download
  qrCanvasWrapper.addEventListener('click', () => {
    downloadJpg();
  });

  // 2) Clicking the dedicated 'JPG 다운로드' button
  btnDownloadJpg.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadJpg();
  });

  // 3) Copy URL button
  btnCopyUrl.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentUrl) return;

    try {
      await navigator.clipboard.writeText(currentUrl);
      showToast('링크가 클립보드에 복사되었습니다.', 'success');
    } catch (err) {
      const temp = document.createElement('input');
      temp.value = currentUrl;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showToast('링크가 클립보드에 복사되었습니다.', 'success');
    }
  });

  // 4) Reset to initial state (Center Input)
  function resetToInitialMode() {
    mainWrapper.classList.remove('has-result');
    urlInput.value = '';
    btnClearInput.classList.remove('visible');
    highResJpgDataUrl = null;
    urlInput.focus();
  }

  btnResetView.addEventListener('click', (e) => {
    e.stopPropagation();
    resetToInitialMode();
  });

  brandHome.addEventListener('click', (e) => {
    e.preventDefault();
    resetToInitialMode();
  });

  /**
   * Toast notification helper
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="${iconClass}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Handle URL query parameter (?url=...)
  const params = new URLSearchParams(window.location.search);
  const paramUrl = params.get('url');
  if (paramUrl) {
    urlInput.value = paramUrl;
    btnClearInput.classList.add('visible');
    // 자동 생성 실행
    urlForm.dispatchEvent(new Event('submit'));
  }
});
