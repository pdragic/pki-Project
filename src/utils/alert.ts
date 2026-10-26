import Swal, { type SweetAlertIcon } from 'sweetalert2'

const theme = {
  background: 'var(--bs-body-bg)',
  color: 'var(--bs-body-color)',
  buttonsStyling: false,
  reverseButtons: true,
}

const base = Swal.mixin(theme)

const Toast = Swal.mixin({
  ...theme,
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
})

export function toast(title: string, icon: SweetAlertIcon = 'success') {
  return Toast.fire({ icon, title })
}

export function successDialog(title: string, text = '') {
  return base.fire({
    icon: 'success', title, text, confirmButtonText: 'U redu',
    customClass: { confirmButton: 'btn btn-success mx-1' },
  })
}

export function errorDialog(title: string, text = '') {
  return base.fire({
    icon: 'error', title, text, confirmButtonText: 'U redu',
    customClass: { confirmButton: 'btn btn-danger mx-1' },
  })
}

export async function confirmDialog(opts: {
  title: string
  text: string
  confirmText: string
  danger?: boolean
  icon?: SweetAlertIcon
}): Promise<boolean> {
  const res = await base.fire({
    title: opts.title,
    text: opts.text,
    icon: opts.icon ?? (opts.danger ? 'warning' : 'question'),
    showCancelButton: true,
    confirmButtonText: opts.confirmText,
    cancelButtonText: 'Odustani',
    focusCancel: !!opts.danger,
    customClass: {
      confirmButton: `btn ${opts.danger ? 'btn-danger' : 'btn-success'} mx-1`,
      cancelButton: 'btn btn-secondary mx-1',
    },
  })
  return res.isConfirmed
}

// ---------- prozor za učitavanje ----------
let loadingToken = 0
let loadingShownAt = 0

// vraća oznaku; samo vlasnik oznake sme da zatvori prozor
export function showLoading(
  title = 'Učitavanje biljaka...',
  text = 'Molimo sačekajte trenutak.',
): number {
  const token = ++loadingToken
  loadingShownAt = Date.now()
  base.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  })
  return token
}

// prozor ostaje bar minMs, da ne bi samo "bljesnuo" kad je odgovor brz
export async function hideLoading(token: number, minMs = 600) {
  const elapsed = Date.now() - loadingShownAt
  if (elapsed < minMs) await new Promise(r => setTimeout(r, minMs - elapsed))
  // u međuvremenu je otvoren novi prozor, ili ovo više nije prozor za učitavanje
  if (token !== loadingToken || !Swal.isLoading()) return
  Swal.close()
}