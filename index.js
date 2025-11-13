/* Social Poster Extension (v1.0.1 - Fallback Loader) */
(() => {
    // ป้องกันการโหลดซ้ำ
    if (window.SOCIAL_POSTER_EXT_LOADED) return;
    window.SOCIAL_POSTER_EXT_LOADED = true;

    const MODULE = 'socialPosterExt';
    const DEFAULTS = { 
        posts: [] // โครงสร้าง: { content: "...", timestamp: 123456789 }
    };

    // --- ฟังก์ชันตัวช่วยพื้นฐาน (Utility Functions) ---
    function getCtx() {
        try { return window.SillyTavern?.getContext?.() || null; } catch (_) { return null; }
    }

    function ensureSettings() {
        const ctx = getCtx();
        if (!ctx) return structuredClone(DEFAULTS);
        const store = ctx.extensionSettings || (ctx.extensionSettings = {});
        if (!store[MODULE]) store[MODULE] = {};
        
        if (!Array.isArray(store[MODULE].posts)) {
            store[MODULE].posts = DEFAULTS.posts;
        }
        return store[MODULE];
    }

    function saveSettings() {
        const ctx = getCtx();
        (ctx?.saveSettingsDebounced || ctx?.saveSettings || (()=>{})).call(ctx);
    }

    // --- ฟังก์ชันเกี่ยวกับ Modal และ UI ---

    function showModal() {
        const modal = document.getElementById('social-poster-modal-overlay');
        if (modal) {
            modal.style.display = 'flex';
            renderPosts();
        }
    }

    function hideModal() {
        const modal = document.getElementById('social-poster-modal-overlay');
        if (modal) modal.style.display = 'none';
    }

    function renderPosts() {
        const settings = ensureSettings();
        const listEl = document.getElementById('social-poster-list');
        if (!listEl) return;

        listEl.innerHTML = ''; 

        if (settings.posts.length === 0) {
            listEl.innerHTML = '<div id="social-poster-list-empty">ยังไม่มีโพสต์... ลองสร้างโพสต์ใหม่!</div>';
            return;
        }

        [...settings.posts].reverse().forEach(post => {
            const itemEl = document.createElement('div');
            itemEl.className = 'social-poster-item';

            const contentEl = document.createElement('p');
            contentEl.textContent = post.content; 

            const timeEl = document.createElement('div');
            timeEl.className = 'social-poster-item-time';
            timeEl.textContent = new Date(post.timestamp).toLocaleString('th-TH', {
                day: 'numeric', month: 'short', year: 'numeric', 
                hour: 'numeric', minute: '2-digit'
            });

            itemEl.append(contentEl, timeEl);
            listEl.appendChild(itemEl);
        });
    }

    async function generatePost() {
        const ctx = getCtx();
        if (!ctx || !ctx.chat || !ctx.characters) {
            alert('ไม่สามารถเชื่อมต่อกับ SillyTavern context ได้');
            return;
        }

        // เช็กว่ามีฟังก์ชัน generateRaw หรือไม่
        if (typeof ctx.generateRaw !== 'function') {
            alert('Extension นี้ต้องการฟังก์ชัน generateRaw ซึ่งไม่พบใน SillyTavern เวอร์ชันของคุณ (อาจจะต้องอัปเดต)');
            return;
        }

        const genBtn = document.getElementById('social-poster-generate-btn');
        genBtn.disabled = true;
        genBtn.classList.add('loading');
        genBtn.textContent = 'กำลังสร้าง...';

        try {
            const history = ctx.chat.slice(-10);
            const chatLog = history
                .map(msg => `${msg.is_user ? '{{user}}' : '{{char}}'}: ${msg.mes}`)
                .join('\n');

            const charName = ctx.characters[ctx.characterId]?.name || '{{char}}';

            const prompt = `[คำสั่ง: นี่คือการจำลองสถานการณ์ลับสุดยอด]
ตัวละคร ${charName} กำลังแอบเล่นโซเชียลมีเดีย
จากบทสนทนาล่าสุดนี้ ${charName} จะต้องเขียนโพสต์สั้นๆ (เหมือนทวีตหรือสเตตัส) เพื่อบ่น, อวด, หรือแค่ระบายความรู้สึกเกี่ยวกับสิ่งที่เกิดขึ้น
ข้อแม้:
- ต้องเขียนในคาแรคเตอร์ของ ${charName}
- ห้ามเอ่ยชื่อ {{user}} โดยตรง
- โพสต์ต้องสั้น กระชับ (ไม่เกิน 280 ตัวอักษร)
- ให้เขียน **เฉพาะเนื้อหาของโพสต์เท่านั้น** ห้ามมีคำพูดอื่นใดอธิบาย

**บทสนทนาล่าสุด:**
${chatLog}

**โพสต์โซเชียลของ ${charName}:**
`;

            let postContent = await ctx.generateRaw(prompt);

            if (!postContent || typeof postContent !== 'string') {
                throw new Error('AI ไม่ได้ส่งข้อความกลับมา');
            }
            postContent = postContent.trim();
            
            if (postContent.startsWith('"') && postContent.endsWith('"')) {
                postContent = postContent.slice(1, -1).trim();
            }
            postContent = postContent.replace(/^.*?:/s, '').trim();

            if (postContent) {
                const settings = ensureSettings();
                settings.posts.push({
                    content: postContent,
                    timestamp: Date.now()
                });
                saveSettings();
                renderPosts();
            }

        } catch (err) {
            console.error('[SocialPosterExt] Error generating post:', err);
            alert('เกิดข้อผิดพลาดขณะสร้างโพสต์: ' + err.message);
        } finally {
            genBtn.disabled = false;
            genBtn.classList.remove('loading');
            genBtn.textContent = 'สร้างโพสต์ใหม่';
        }
    }

    // --- ฟังก์ชันเริ่มต้น (Initialization) ---

    function createModalHTML() {
        if (document.getElementById('social-poster-modal-overlay')) return;

        const modalHTML = `
            <div id="social-poster-modal-overlay">
                <div id="social-poster-modal-content">
                    <div id="social-poster-modal-header">
                        <h2>โพสต์โซเชียลของ {{char}}</h2>
                        <button id="social-poster-modal-close" title="ปิด">&times;</button>
                    </div>
                    <div id="social-poster-list">
                        </div>
                    <div id="social-poster-modal-footer">
                        <button id="social-poster-generate-btn">สร้างโพสต์ใหม่</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('social-poster-modal-close').onclick = hideModal;
        document.getElementById('social-poster-generate-btn').onclick = generatePost;
        
        document.getElementById('social-poster-modal-overlay').onclick = (e) => {
            if (e.target.id === 'social-poster-modal-overlay') {
                hideModal();
            }
        };
    }

    function addChatButton() {
        if (document.getElementById('social-poster-ext-btn')) return;

        // แก้ไข: เพิ่มการรอ `document.body` ให้พร้อมก่อน
        if (!document.body) {
            setTimeout(addChatButton, 500);
            return;
        }

        const mount = document.querySelector('.chat-input-container, .chat-controls, .st-user-input');
        
        // ถ้ายังหา mount point ไม่เจอ (หน้าเว็บยังโหลดไม่เสร็จ)
        if (!mount) {
            console.log('[SocialPosterExt] Waiting for UI...');
            setTimeout(addChatButton, 1000); // ลองใหม่ใน 1 วินาที
            return;
        }

        console.log('[SocialPosterExt] UI Ready, adding button.');
        const container = document.createElement('div');
        container.id = 'social-poster-ext-container';
        
        const btn = document.createElement('button');
        btn.id = 'social-poster-ext-btn';
        btn.type = 'button';
        btn.textContent = '💬 โพสต์';
        btn.title = 'ดู/สร้าง โพสต์โซเชียลของตัวละคร';
        btn.onclick = showModal;

        container.appendChild(btn);
        mount.appendChild(container);
    }

    /**
     * เริ่มต้นการทำงานของ Extension (เวอร์ชันแก้ไข)
     * ลบ Event Listener ที่เป็นปัญหาออก
     */
    function initializeExtension() {
        ensureSettings(); 
        createModalHTML();
        addChatButton();
    }

    // --- นี่คือวิธีรอโหลดแบบใหม่ที่ปลอดภัยกว่า ---
    // จะรอให้หน้าเว็บโหลดเสร็จ 100% (DOM) แล้วค่อยเริ่มทำงาน
    // จากนั้นจะหน่วงเวลาอีก 1.5 วินาที เพื่อให้แน่ใจว่า UI ของ ST โหลดเสร็จจริงๆ
    // นี่คือวิธีที่ใช้ใน Extension เก่าๆ และมักจะ work ครับ
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[SocialPosterExt] DOM Loaded. Waiting for ST UI...');
        setTimeout(initializeExtension, 1500); // หน่วงเวลา 1.5 วินาที
    });

})();
