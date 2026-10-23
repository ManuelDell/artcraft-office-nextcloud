// Full-page editor for Nextcloud DirectEditing (clients + "Open with"). The open() PHP renders
// #wc-directedit with the file's WebDAV path/name/mime/user; we mount the matching editor
// full-screen. Same two modes as the Files action: URL (WordCraft/DeckCraft) and host-bridge
// (GridCraft/PdfCraft). Content load/save go over WebDAV in the token-scoped session.

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const PDF = 'application/pdf'

const el = document.getElementById('wc-directedit')
const dav = el ? el.dataset.src : ''
const name = el ? (el.dataset.name || '') : ''
const mime = el ? (el.dataset.mime || '') : ''
const user = el ? (el.dataset.user || '') : ''
const low = name.toLowerCase()
const EDITORS = ((window.OC && window.OC.appswebroots && window.OC.appswebroots.wordcraft) || '/apps/wordcraft') + '/editors'

function mount(src) {
    const f = document.createElement('iframe')
    f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;display:block'
    f.allow = 'clipboard-read; clipboard-write; fullscreen'
    f.src = src
    document.body.appendChild(f)
    return f
}
async function fetchAB(url) {
    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) { throw new Error('HTTP ' + r.status) }
    return await r.arrayBuffer()
}
async function putBytes(url, body, m) {
    const headers = { 'Content-Type': m }
    const t = window.OC && window.OC.requestToken
    if (t) { headers.requesttoken = t }
    const r = await fetch(url, { method: 'PUT', headers, body, credentials: 'same-origin' })
    if (!r.ok) { throw new Error('HTTP ' + r.status) }
}
function openUrl(app) {
    const p = new URLSearchParams()
    p.set('src', dav); p.set('save', dav); p.set('name', name)
    if (user) { p.set('user', user) }
    mount(EDITORS + '/' + app + '/?' + p.toString())
}
function openBridge(app, prefix, m) {
    const f = mount(EDITORS + '/' + app + '/?host=parent')
    window.addEventListener('message', async (e) => {
        if (e.origin !== location.origin || e.source !== f.contentWindow) { return }
        const d = e.data || {}
        if (d.type === prefix + ':ready') {
            try {
                const buf = await fetchAB(dav)
                f.contentWindow.postMessage({ type: prefix + ':open', name, bytes: buf }, location.origin, [buf])
            } catch (err) { console.error('[wordcraft] directedit ' + prefix + ' open failed', err) }
        } else if (d.type === prefix + ':save') {
            try { await putBytes(dav, d.bytes, m) } catch (err) { console.error('[wordcraft] directedit ' + prefix + ' save failed', err) }
        }
    })
}

if (!dav) {
    console.error('[wordcraft] directedit: no file')
} else if (mime === DOCX || low.endsWith('.docx')) {
    openUrl('wordcraft')
} else if (mime === PPTX || low.endsWith('.pptx')) {
    openUrl('deckcraft')
} else if (mime === XLSX || low.endsWith('.xlsx')) {
    openBridge('gridcraft', 'gridcraft', XLSX)
} else if (mime === PDF || low.endsWith('.pdf')) {
    openBridge('pdfcraft', 'pdfcraft', PDF)
} else {
    console.error('[wordcraft] directedit: unsupported mime', mime, name)
}
