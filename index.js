/* Social Post Generator for SillyTavern
   - อ่านข้อความแชทล่าสุดโดยใช้ MutationObserver (อ่านเฉพาะข้อความที่ปรากฏใน DOM)
   - รวมข้อความ (ตามจำนวนที่ผู้ใช้เลือก) แล้วแปลงเป็นโพสต์โดยใช้ heuristics ง่ายๆ
   - ไม่โพสต์แทนผู้ใช้ — มีปุ่ม copy และเปิดหน้าต่างแชร์ (Twitter intent, Facebook share)
*/

(() => {
  // == ชื่อ element ใน SillyTavern ที่เราเฝ้าดู ==
  // NOTE: SillyTavern DOM อาจเปลี่ยนได้ -> ถ้าไม่เจอข้อความให้ปรับ selector
  const CHAT_SELECTOR_CANDIDATES = [
    '.chat-messages', // hypothetical
    '.messages',       // some themes
    '#chat',           // fallback
    '.ST-messages'     // another
  ];

  // == helper ==
  function $id(id){ return document.getElementById(id); }
  function qs(sel){ return document.querySelector(sel); }

  // UI elements
  const toneEl = $id('spg-tone');
  const countEl = $id('spg-count');
  const draftEl = $id('spg-draft');
  const messagesEl = $id('spg-messages');
  const copyBtn = $id('spg-copy');
  const editBtn = $id('spg-edit');
  const openTweetBtn = $id('spg-open-tweet');
  const openFbBtn = $id('spg-open-fb');
  const insertHashtags = $id('spg-insert-hashtags');
  const keywordsEl = $id('spg-keywords');

  // state
  let chatContainer = null;
  let observer = null;
  let lastExtracted = [];
  let debounceTimer = null;

  // try to find a likely chat container
  function findChatContainer() {
    for (const s of CHAT_SELECTOR_CANDIDATES) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    // fallback: find big container with many text children
    const all = Array.from(document.querySelectorAll('div'));
    let best = null, bestCount = 0;
    for (const el of all) {
      const txt = el.innerText || '';
      const count = (txt.match(/\n/g) || []).length;
      if (count > bestCount && txt.length > 200) { best = el; bestCount = count; }
    }
    return best;
  }

  // extract messages from DOM: returns array of {who, text}
  function extractMessagesFromDom() {
    if (!chatContainer) chatContainer = findChatContainer();
    if (!chatContainer) return [];

    // Heuristics: many themes have repeated message nodes. We'll traverse children and
    // collect short text blocks that look like messages.
    const nodes = Array.from(chatContainer.querySelectorAll('*'));
    const msgs = [];
    for (const n of nodes) {
      // skip containers
      const text = (n.innerText || '').trim();
      if (!text) continue;
      // heuristics: treat ones with linebreaks or limited length as a message
      if (text.length > 6 && text.length < 2000) {
        // attempt to identify speaker by preceding sibling or .who class
        let who = 'Unknown';
        const whoEl = n.querySelector('.who, .speaker, .name') || n.previousElementSibling && (n.previousElementSibling.querySelector && (n.previousElementSibling.querySelector('.who') || n.previousElementSibling));
        if (whoEl && whoEl.innerText) {
          who = whoEl.innerText.trim().split('\n')[0];
        } else {
          // attempt to parse prefix like "Player: text"
          const m = text.match(/^([A-Za-z0-9_ก-๙\- ]{1,40}):\s/);
          if (m) who = m[1];
        }
        msgs.push({ who, text });
      }
    }

    // cleanup: merge contiguous messages by same speaker and dedupe small ones
    const out = [];
    for (const m of msgs) {
      if (!out.length) { out.push(m); continue; }
      const last = out[out.length - 1];
      if (last.who === m.who && m.text.length < 220) {
        last.text = last.text + '\n' + m.text;
      } else {
        out.push(m);
      }
    }
    return out;
  }

  // build draft post from messages and tone
  function buildDraftFromMessages(msgs, tone, maxCount, keywords) {
    if (!msgs || msgs.length === 0) return '';

    // take last N messages
    const last = msgs.slice(-maxCount);

    // Compose a short summary by heuristics:
    // - take notable lines (lines containing exclamation/question or emotional words)
    // - fallback: take short snippets from each message
    const snippets = [];
    for (const m of last) {
      // split into lines, pick the 'most expressive' line
      const lines = m.text.split(/\n/).map(s=>s.trim()).filter(Boolean);
      let best = lines[0] || '';
      // prefer lines with punctuation or shortness
      for (const l of lines.slice(0,3)) {
        if (/[!?]/.test(l) || l.length < 80) { best = l; break; }
      }
      // prepend who if not system
      if (m.who && !/^\s*$/.test(m.who)) best = `${m.who}: ${best}`;
      snippets.push(best);
    }

    // tone transformation rules
    function toTone(text, t) {
      if (!text) return text;
      switch (t) {
        case 'complain':
          // add a complaining prefix and a sigh
          return `อีกแล้ว... ${text} ทำไมมันต้องเป็นแบบนี้นะ`;
        case 'funny':
          return `${text} ฮาา ๆ 😂 #ชีวิตโรล`;
        case 'sad':
          return `${text} ...ก็เป็นงี้แหละ`;
        case 'brag':
          return `ชนะอีกแล้ว 😎 ${text}`;
        case 'neutral':
        default:
          return text;
      }
    }

    // join snippets into short paragraph
    let base = snippets.join(' / ');
    // limit length to ~240 (for twitter)
    if (base.length > 220) base = base.slice(0, 217) + '...';

    // apply tone
    const toned = toTone(base, tone);

    // hashtags
    let hashtags = '';
    if (insertHashtags.checked && keywords && keywords.length) {
      const kws = keywords.split(',').map(k=>k.trim()).filter(Boolean).slice(0,5)
                    .map(k=> '#'+k.replace(/\s+/g,''));
      if (kws.length) hashtags = ' ' + kws.join(' ');
    }

    return toned + hashtags;
  }

  // render messages list in UI
  function renderMessages(msgs) {
    messagesEl.innerHTML = '';
    msgs.slice(-30).reverse().forEach(m=>{
      const div = document.createElement('div');
      div.className = 'msg';
      const whoDiv = document.createElement('div');
      whoDiv.className = 'who';
      whoDiv.textContent = (m.who || 'Unknown').slice(0,40);
      const textDiv = document.createElement('div');
      textDiv.className = 'text';
      textDiv.textContent = m.text.length>300 ? m.text.slice(0,300)+'...' : m.text;
      div.appendChild(whoDiv);
      div.appendChild(textDiv);
      messagesEl.appendChild(div);
    });
  }

  // set draft text to textarea (or keep user edits if they toggled)
  let userEditing = false;
  function setDraft(text) {
    if (userEditing) return;
    draftEl.value = text;
  }

  // core: update pipeline (extract -> build -> render)
  function updatePipeline() {
    const msgs = extractMessagesFromDom();
    // simple dedupe: if identical to lastExtracted, skip
    const key = msgs.map(m=>m.who+':'+m.text.slice(0,80)).join('|');
    const lastKey = lastExtracted.map(m=>m.who+':'+m.text.slice(0,80)).join('|');
    if (key === lastKey) {
      // nothing changed
      return;
    }
    lastExtracted = msgs;
    renderMessages(msgs);
    const tone = toneEl.value;
    const maxCount = parseInt(countEl.value,10) || 4;
    const keywords = keywordsEl.value || '';
    const draft = buildDraftFromMessages(msgs, tone, maxCount, keywords);
    setDraft(draft);
  }

  // attach observer to chat container
  function attachObserver() {
    if (observer) observer.disconnect();
    if (!chatContainer) chatContainer = findChatContainer();
    if (!chatContainer) {
      console.warn('[SPG] chat container not found — will retry later');
      return;
    }
    observer = new MutationObserver(muts=>{
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(()=> {
        try{ updatePipeline(); } catch(e){ console.error('[SPG] update error', e); }
      }, 600);
    });
    observer.observe(chatContainer, { childList: true, subtree:true, characterData:true });
    // initial update
    updatePipeline();
  }

  // UI event handlers
  copyBtn.addEventListener('click', ()=>{
    const text = draftEl.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(()=>{
      copyBtn.textContent = 'คัดลอกแล้ว ✓';
      setTimeout(()=> copyBtn.textContent = 'คัดลอก', 1200);
    }).catch(err=>{
      alert('คัดลอกไม่สำเร็จ — เบราว์เซอร์อาจบล็อกการคัดลอก: '+err);
    });
  });

  editBtn.addEventListener('click', ()=>{
    if (!userEditing) {
      draftEl.removeAttribute('readonly');
      draftEl.focus();
      editBtn.textContent = 'บันทึก';
      userEditing = true;
    } else {
      // save edits: make them final until next auto-update
      draftEl.setAttribute('readonly','');
      editBtn.textContent = 'แก้ไข';
      userEditing = false;
    }
  });

  openTweetBtn.addEventListener('click', ()=>{
    const text = draftEl.value || '';
    // tweet intent: https://twitter.com/intent/tweet?text=...
    const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
  });

  openFbBtn.addEventListener('click', ()=>{
    const text = draftEl.value || '';
    // Facebook share dialog can prefill quote param:
    // https://www.facebook.com/sharer/sharer.php?u=<url>&quote=<text>
    // Since we don't have a URL, we can share a dummy url with the quote
    const dummyUrl = 'https://example.com/roleplay'; // user can edit
    const url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(dummyUrl) + '&quote=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
  });

  // detect when user edits keywords/tone/count -> rebuild
  [toneEl, countEl, keywordsEl, insertHashtags].forEach(el=>{
    el.addEventListener('change', ()=> {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePipeline, 250);
    });
  });

  // if user types into draft while editing, keep userEditing true
  draftEl.addEventListener('input', ()=> { if (draftEl.hasAttribute('readonly')) return; userEditing = true; });

  // initialize on DOM ready (panel load)
  function initWhenReady(){
    // try find container now
    chatContainer = findChatContainer();
    if (!chatContainer) {
      // retry a few times in the background
      let tries = 0;
      const t = setInterval(()=>{
        tries++;
        chatContainer = findChatContainer();
        if (chatContainer || tries > 10) {
          clearInterval(t);
          attachObserver();
        }
      }, 800);
    } else {
      attachObserver();
    }
  }

  // small notification in console for debugging
  console.info('[SPG] Social Post Generator loaded');

  // start
  initWhenReady();

  // expose minimal debug API on window (dev only)
  window.__SPG = {
    updatePipeline,
    extractMessagesFromDom,
    findChatContainer
  };
})();
