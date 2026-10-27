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

let loadingToken = 0
let loadingShownAt = 0

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

export async function hideLoading(token: number, minMs = 600) {
  const elapsed = Date.now() - loadingShownAt
  if (elapsed < minMs) await new Promise(r => setTimeout(r, minMs - elapsed))
  if (token !== loadingToken || !Swal.isLoading()) return
  Swal.close()
}

export async function reviewDialog(opts: {
  title: string
  rating?: number
  text?: string
}): Promise<{ rating: number; text: string } | null> {
  let rating = opts.rating ?? 0

  const res = await base.fire({
    title: opts.title,
    html:
      '<div class="rv-stars" role="radiogroup" aria-label="Ocena">' +
      [1, 2, 3, 4, 5]
        .map(n => `<button type="button" class="rv-star" data-n="${n}" aria-label="${n} od 5"><i class="fa-regular fa-star"></i></button>`)
        .join('') +
      '</div>' +
      '<textarea id="rv-text" class="swal2-textarea" maxlength="300" placeholder="Vaša recenzija (neobavezno)"></textarea>',
    showCancelButton: true,
    confirmButtonText: 'Sačuvaj',
    cancelButtonText: 'Odustani',
    customClass: {
      confirmButton: 'btn btn-success mx-1',
      cancelButton: 'btn btn-secondary mx-1',
    },
    didOpen: popup => {
      const stars = popup.querySelectorAll<HTMLButtonElement>('.rv-star')
      const paint = () =>
        stars.forEach(b => {
          const icon = b.querySelector('i')
          if (icon) icon.className = `${Number(b.dataset.n) <= rating ? 'fa-solid' : 'fa-regular'} fa-star`
        })
      stars.forEach(b =>
        b.addEventListener('click', () => {
          rating = Number(b.dataset.n)
          paint()
        }),
      )
      const ta = popup.querySelector<HTMLTextAreaElement>('#rv-text')
      if (ta) ta.value = opts.text ?? ''
      paint()
    },
    preConfirm: () => {
      if (rating < 1) {
        Swal.showValidationMessage('Izaberite ocenu od 1 do 5 zvezdica.')
        return false
      }
      const ta = document.getElementById('rv-text') as HTMLTextAreaElement | null
      return { rating, text: ta?.value.trim() ?? '' }
    },
  })

  return res.isConfirmed && res.value ? (res.value as { rating: number; text: string }) : null
}