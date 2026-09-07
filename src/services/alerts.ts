import Swal, { type SweetAlertOptions } from 'sweetalert2';

/**
 * SweetAlert2, themed to match the dark auth screens.
 *
 * Centralised so every dialog in the app looks the same and the brand colours live
 * in one place rather than being repeated at each call site.
 */

const BRAND = '#34C759';
const SURFACE = '#111827';
const TEXT = '#E5E7EB';

const base: SweetAlertOptions = {
  background: SURFACE,
  color: TEXT,
  confirmButtonColor: BRAND,
  cancelButtonColor: '#374151',
  customClass: { popup: 'rounded-3xl' },
};

export const Alerts = {
  success(title: string, text?: string) {
    return Swal.fire({ ...base, icon: 'success', title, text });
  },

  error(title: string, text?: string) {
    return Swal.fire({ ...base, icon: 'error', title, text });
  },

  warning(title: string, text?: string) {
    return Swal.fire({ ...base, icon: 'warning', title, text });
  },

  /** Success that closes itself, for outcomes followed by a redirect. */
  toast(title: string, timer = 1600) {
    return Swal.fire({
      ...base,
      icon: 'success',
      title,
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  },

  /** Blocking spinner. Call `Alerts.close()` when the work finishes. */
  loading(title: string) {
    return Swal.fire({
      ...base,
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
  },

  close() {
    Swal.close();
  },

  confirm(title: string, text: string, confirmText = 'Confirm') {
    return Swal.fire({
      ...base,
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
    }).then(r => r.isConfirmed);
  },
};
