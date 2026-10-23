import { registerFileAction } from '@nextcloud/files'
import { getCurrentUser } from '@nextcloud/auth'

console.info('[wordcraft] script loaded')

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const OVERLAY_ID = 'wordcraft-overlay'

/** Build the editor URL for a Files Node (same-origin → session cookie carries auth). */
function editorUrl(node) {
    const user = getCurrentUser()
    // encodedSource is the properly-encoded WebDAV URL of the file; fall back to source.
    const dav = node.encodedSource || node.source
    const params = new URLSearchParams()
    params.set('src', dav)
    params.set('save', dav)
    params.set('name', node.basename)
    if (user && user.displayName) {
        params.set('user', user.displayName)
    }
    return '/wordcraft/?' + params.toString()
}

function button(label, title) {
    const b = document.createElement('button')
    b.textContent = label
    b.title = title
    Object.assign(b.style, {
        cursor: 'pointer', border: 'none', borderRadius: '6px', padding: '6px 10px',
        font: '13px system-ui, sans-serif', background: 'rgba(0,0,0,.65)', color: '#fff',
    })
    return b
}

/** Default: embed the editor in a modal overlay, with a popout-to-new-tab button. */
function openOverlay(url) {
    if (document.getElementById(OVERLAY_ID)) {
        return
    }
    const overlay = document.createElement('div')
    overlay.id = OVERLAY_ID
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '100000', background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    })

    const box = document.createElement('div')
    Object.assign(box.style, {
        position: 'relative', width: '92vw', height: '92vh', background: '#fff',
        borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.4)',
    })

    const bar = document.createElement('div')
    Object.assign(bar.style, { position: 'absolute', top: '8px', right: '10px', zIndex: '2', display: 'flex', gap: '6px' })

    const popout = button('In neuem Tab ↗', 'Im Vollbild in neuem Tab öffnen')
    const close = button('✕', 'Schließen (Esc)')

    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, { width: '100%', height: '100%', border: '0', display: 'block' })
    iframe.src = url
    iframe.allow = 'clipboard-read; clipboard-write; fullscreen'

    const shut = () => {
        overlay.remove()
        document.removeEventListener('keydown', onKey)
    }
    const onKey = (e) => { if (e.key === 'Escape') { shut() } }

    popout.addEventListener('click', () => { window.open(url, '_blank', 'noopener'); shut() })
    close.addEventListener('click', shut)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { shut() } })
    document.addEventListener('keydown', onKey)

    bar.append(popout, close)
    box.append(bar, iframe)
    overlay.append(box)
    document.body.append(overlay)
}

function isDocx(node) {
    const mime = node && node.mime ? node.mime : ''
    const name = node && node.basename ? String(node.basename).toLowerCase() : ''
    return mime === DOCX || name.endsWith('.docx')
}

try {
    registerFileAction({
        id: 'wordcraft-open',
        displayName: () => 'In WordCraft öffnen',
        iconSvgInline: () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>',
        // @nextcloud/files v4: callbacks receive an ActionContext ({ nodes, view, folder, contents }).
        enabled: (context) => context.nodes.length === 1 && isDocx(context.nodes[0]),
        async exec(context) {
            try {
                openOverlay(editorUrl(context.nodes[0]))
                return true
            } catch (e) {
                console.error('[wordcraft] open failed', e)
                return false
            }
        },
        order: 10,
    })
    console.info('[wordcraft] file action "wordcraft-open" registered')
} catch (e) {
    console.error('[wordcraft] registerFileAction failed', e)
}
