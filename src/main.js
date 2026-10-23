import { registerFileAction, DefaultType } from '@nextcloud/files'
import { getCurrentUser } from '@nextcloud/auth'

console.info('[wordcraft] script loaded')

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const PDF = 'application/pdf'
const OVERLAY_ID = 'wordcraft-overlay'
// Editors are bundled inside this app and served from its own web root (self-contained).
const EDITORS = ((window.OC && window.OC.appswebroots && window.OC.appswebroots.wordcraft) || '/apps/wordcraft') + '/editors'

// WordCraft brand mark (blue document) — assets/app-icon/wordcraft.svg.
const LOGO_WC = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    + '<rect width="512" height="512" rx="112" fill="#3B5BDB"/>'
    + '<g transform="rotate(-6 256 256)">'
    + '<path d="M150 92 H322 L384 154 V420 H150 Z" fill="#efe9dc" stroke="#0b0b0c" stroke-width="14" stroke-linejoin="round"/>'
    + '<path d="M322 92 V154 H384" fill="none" stroke="#0b0b0c" stroke-width="14" stroke-linejoin="round"/>'
    + '<g stroke="#0b0b0c" stroke-width="14" stroke-linecap="round">'
    + '<line x1="190" y1="200" x2="344" y2="200"/><line x1="190" y1="246" x2="344" y2="246"/>'
    + '<line x1="190" y1="292" x2="344" y2="292"/><line x1="190" y1="338" x2="290" y2="338"/></g></g>'
    + '<path d="M300 410 L418 292 L446 320 L328 438 L292 446 Z" fill="#0b0b0c"/>'
    + '<path d="M418 292 L436 274 L464 302 L446 320 Z" fill="#efe9dc" stroke="#0b0b0c" stroke-width="8"/></svg>'

// GridCraft brand mark (green ledger) — assets/app-icon/gridcraft.svg (clip id namespaced).
const LOGO_GC = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    + '<defs><clipPath id="wc-gc-tile"><rect width="512" height="512" rx="112"/></clipPath></defs>'
    + '<g clip-path="url(#wc-gc-tile)"><rect width="512" height="512" fill="#1f9d55"/>'
    + '<g transform="rotate(-6 256 268)" stroke="#0b0b0c" stroke-linejoin="round" stroke-linecap="round">'
    + '<path d="M112 76 H336 L404 144 V440 H112 Z" fill="#efe9dc" stroke-width="14"/>'
    + '<path d="M336 76 V144 H404" fill="none" stroke-width="12"/>'
    + '<path d="M146 106 H272 M146 130 H232" stroke-width="12"/>'
    + '<path d="M112 164 H404 V204 H164 V440 H112 Z" fill="#1f9d55" stroke="none"/>'
    + '<path d="M112 164 H404 M112 204 H404 M112 250 H404 M112 296 H404 M112 342 H404 M112 388 H404 M164 164 V440 M244 164 V440 M324 164 V440" fill="none" stroke-width="8"/>'
    + '<rect x="244" y="250" width="80" height="46" fill="none" stroke-width="16"/>'
    + '<rect x="312" y="284" width="24" height="24" fill="#0b0b0c" stroke="#efe9dc" stroke-width="5"/>'
    + '<path d="M252 410 H316 M252 424 H316" stroke-width="7"/></g></g></svg>'

// DeckCraft brand mark (amber slide on a stand).
const LOGO_DC = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    + '<rect width="512" height="512" rx="112" fill="#f08c00"/>'
    + '<rect x="104" y="120" width="304" height="200" rx="12" fill="#efe9dc" stroke="#0b0b0c" stroke-width="14"/>'
    + '<g stroke="#0b0b0c" stroke-width="14" stroke-linecap="round"><line x1="150" y1="176" x2="300" y2="176"/>'
    + '<line x1="150" y1="222" x2="362" y2="222"/><line x1="150" y1="268" x2="330" y2="268"/></g>'
    + '<line x1="256" y1="320" x2="256" y2="366" stroke="#0b0b0c" stroke-width="14"/>'
    + '<path d="M190 404 H322 L302 366 H210 Z" fill="#0b0b0c"/></svg>'

// PdfCraft brand mark (teal document).
const LOGO_PDF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    + '<rect width="512" height="512" rx="112" fill="#12a58a"/>'
    + '<path d="M150 80 H320 L392 152 V432 H150 Z" fill="#efe9dc" stroke="#0b0b0c" stroke-width="14" stroke-linejoin="round"/>'
    + '<path d="M320 80 V152 H392" fill="none" stroke="#0b0b0c" stroke-width="14" stroke-linejoin="round"/>'
    + '<text x="270" y="344" font-family="system-ui, sans-serif" font-size="92" font-weight="700" text-anchor="middle" fill="#12a58a">PDF</text></svg>'

const matches = (node, mime, ext) => {
    if (!node) { return false }
    const m = node.mime || ''
    const n = (node.basename || '').toLowerCase()
    return m === mime || n.endsWith('.' + ext)
}
const davOf = (node) => node.encodedSource || node.source

async function fetchArrayBuffer(url) {
    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) { throw new Error('HTTP ' + r.status) }
    return await r.arrayBuffer()
}
async function putBytes(url, body, mime) {
    const headers = { 'Content-Type': mime }
    const token = window.OC && window.OC.requestToken
    if (token) { headers.requesttoken = token }
    const r = await fetch(url, { method: 'PUT', headers, body, credentials: 'same-origin' })
    if (!r.ok) { throw new Error('HTTP ' + r.status) }
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

/**
 * Embedded editor overlay. `wire(iframe)` may return a cleanup function (used by the
 * GridCraft postMessage bridge). The popout opens the same `src` in a new tab.
 */
function openOverlay(src, wire) {
    if (document.getElementById(OVERLAY_ID)) { return }
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
    iframe.src = src
    iframe.allow = 'clipboard-read; clipboard-write; fullscreen'

    let cleanup = null
    const shut = () => {
        if (cleanup) { try { cleanup() } catch (e) { /* ignore */ } }
        overlay.remove()
        document.removeEventListener('keydown', onKey)
    }
    const onKey = (e) => { if (e.key === 'Escape') { shut() } }
    popout.addEventListener('click', () => { window.open(src, '_blank', 'noopener'); shut() })
    close.addEventListener('click', shut)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { shut() } })
    document.addEventListener('keydown', onKey)
    bar.append(popout, close)
    box.append(bar, iframe)
    overlay.append(box)
    document.body.append(overlay)
    if (wire) { cleanup = wire(iframe) || null }
}

// --- URL mode (WordCraft/DeckCraft): the editor fetches/saves over WebDAV itself ---
function openUrlEditor(base, dav, name) {
    const p = new URLSearchParams()
    p.set('src', dav); p.set('save', dav); p.set('name', name)
    const user = getCurrentUser()
    if (user && user.displayName) { p.set('user', user.displayName) }
    openOverlay(base + '/?' + p.toString())
}
const openWord = (dav, name) => openUrlEditor(EDITORS + '/wordcraft', dav, name)
const openDeck = (dav, name) => openUrlEditor(EDITORS + '/deckcraft', dav, name)

// --- Bridge mode (GridCraft/PdfCraft): postMessage `?host=parent` ---
function openBridge(appPath, prefix, dav, name, mime) {
    openOverlay(EDITORS + '/' + appPath + '/?host=parent', (iframe) => {
        const onMsg = async (e) => {
            if (e.origin !== location.origin || e.source !== iframe.contentWindow) { return }
            const d = e.data || {}
            if (d.type === prefix + ':ready') {
                try {
                    const buf = await fetchArrayBuffer(dav)
                    iframe.contentWindow.postMessage({ type: prefix + ':open', name, bytes: buf }, location.origin, [buf])
                } catch (err) { console.error('[wordcraft] ' + prefix + ' open failed', err) }
            } else if (d.type === prefix + ':save') {
                try { await putBytes(dav, d.bytes, mime) } catch (err) { console.error('[wordcraft] ' + prefix + ' save failed', err) }
            }
        }
        window.addEventListener('message', onMsg)
        return () => window.removeEventListener('message', onMsg)
    })
}
const openGrid = (dav, name) => openBridge('gridcraft', 'gridcraft', dav, name, XLSX)
const openPdf = (dav, name) => openBridge('pdfcraft', 'pdfcraft', dav, name, PDF)

// --- file actions (default on click, brand logo) ---
function action(id, title, logo, mime, ext, open, isDefault = true) {
    try {
        const a = {
            id,
            displayName: () => title,
            iconSvgInline: () => logo,
            enabled: (ctx) => ctx.nodes.length === 1 && matches(ctx.nodes[0], mime, ext),
            async exec(ctx) {
                try { const n = ctx.nodes[0]; open(davOf(n), n.basename); return true }
                catch (e) { console.error('[wordcraft] open failed', e); return false }
            },
            order: 10,
        }
        if (isDefault) { a.default = DefaultType.DEFAULT }
        registerFileAction(a)
    } catch (e) { console.error('[wordcraft] registerFileAction failed', id, e) }
}
action('wordcraft-open', 'In WordCraft öffnen', LOGO_WC, DOCX, 'docx', openWord)
action('gridcraft-open', 'In GridCraft öffnen', LOGO_GC, XLSX, 'xlsx', openGrid)
action('deckcraft-open', 'In DeckCraft öffnen', LOGO_DC, PPTX, 'pptx', openDeck)
// PDF: menu action only (not default-click), so the built-in NC PDF viewer stays the default.
action('pdfcraft-open', 'In PdfCraft bearbeiten', LOGO_PDF, PDF, 'pdf', openPdf, false)

// "+ New" is provided by the DirectEditing creators (lib/DirectEditing) — one set of entries
// for web and clients. The file-open actions above stay as the embedded-overlay experience.

console.info('[wordcraft] registered open actions: word + grid + deck + pdf')
