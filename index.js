/* Social Poster Extension */
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
        
        // ตรวจสอบว่า posts เป็น Array เสมอ
        if (!Array.isArray(store[MODULE].posts)) {
            store[MODULE].posts = DEFAULTS.posts;
        }
        return store[MODULE];
    }

    function saveSettings() {
        const ctx = getCtx();
        // ใช้ฟังก์ชัน save ที่มีใน ST (แบบ debounced หรือแบบธรรมดา)
        (ctx?.saveSettingsDebounced || ctx?.saveSettings || (()=>{})).call(ctx);
    }

    // --- ฟังก์ชันเกี่ยวกับ Modal และ UI ---

    function showModal() {
        const modal = document.getElementById('social-poster-modal-overlay');
        if (modal) {
            modal.style.display = 'flex'; // แสดง Modal
            renderPosts(); // โหลดโพสต์มาแสดง
        }
    }

    function hideModal() {
        const modal = document.getElementById('social-poster-modal-overlay');
        if (modal) modal.style.display = 'none'; // ซ่อน Modal
    }

    /**
     * ดึงโพสต์จาก settings มาแสดงใน Modal
     */
    function renderPosts() {
        const settings = ensureSettings();
        const listEl = document.getElementById('social-poster-list');
        if (!listEl) return;

        listEl.innerHTML = ''; // ล้างลิสต์เก่าก่อน

        if (settings.posts.length === 0) {
            listEl.innerHTML = '<div id="social-poster-list-empty">ยังไม่มีโพสต์... ลองสร้างโพสต์ใหม่!</div>';
            return;
        }

        // วนลูปแบบย้อนกลับ (Clone array ก่อน) เพื่อแสดงโพสต์ใหม่สุดก่อน
        [...settings.posts].reverse().forEach(post => {
            const itemEl = document.createElement('div');
            itemEl.className = 'social-poster-item';

            const contentEl = document.createElement('p');
            contentEl.textContent = post.content; // ใช้ textContent เพื่อความปลอดภัย

            const timeEl = document.createElement('div');
            timeEl.className = 'social-poster-item-time';
            // แปลง timestamp เป็นเวลาที่อ่านง่าย
            timeEl.textContent = new Date(post.timestamp).toLocaleString('th-TH', {
                day: 'numeric', month: 'short', year: 'numeric', 
                hour: 'numeric', minute: '2-digit'
            });

            itemEl.append(contentEl, timeEl);
            listEl.appendChild(itemEl);
        });
    }

    /**
     * ฟังก์ชันหลัก: สร้างโพสต์ใหม่โดยเรียก AI
     */
    async function generatePost() {
        const ctx = getCtx();
        if (!ctx || !ctx.chat || !ctx.characters) {
            alert('ไม่สามารถเชื่อมต่อกับ SillyTavern context ได้');
            return;
        }

        const genBtn = document.getElementById('social-poster-generate-btn');
        genBtn.disabled = true;
        genBtn.classList.add('loading');
        genBtn.textContent = 'กำลังสร้าง...';

        try {
            // 1. ดึงประวัติแชท (10 ข้อความล่าสุด)
            const history = ctx.chat.slice(-10); // เอา 10 ข้อความสุดท้าย
            const chatLog = history
                .map(msg => `${msg.is_user ? '{{user}}' : '{{char}}'}: ${msg.mes}`)
                .join('\n');

            // 2. ดึงชื่อตัวละคร
            const charName = ctx.characters[ctx.characterId]?.name || '{{char}}';

            // 3. สร้าง Prompt (คำสั่งให้ AI)
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

            // 4. เรียก AI (ใช้ generateRaw เพื่อผลลัพธ์ที่ตรงไปตรงมา)
            let postContent = await ctx.generateRaw(prompt);

            // 5. ทำความสะอาดผลลัพธ์
            if (!postContent || typeof postContent !== 'string') {
                throw new Error('AI ไม่ได้ส่งข้อความกลับมา');
            }
            postContent = postContent.trim();
            
            // ลบเครื่องหมายคำพูดที่อาจจะติดมา
            if (postContent.startsWith('"') && postContent.endsWith('"')) {
                postContent = postContent.slice(1, -1).trim();
            }
            // ลบ prefix ที่ AI อาจจะเผลอเติมมา
            postContent = postContent.replace(/^.*?:/s, '').trim();

            if (postContent) {
                // 6. บันทึกโพสต์ใหม่
                const settings = ensureSettings();
                settings.posts.push({
                    content: postContent,
                    timestamp: Date.now()
                });
                saveSettings(); // บันทึกลง extensionSettings

                // 7. แสดงผลโพสต์ใหม่ทันที
                renderPosts();
            }

        } catch (err) {
            console.error('[SocialPosterExt] Error generating post:', err);
            alert('เกิดข้อผิดพลาดขณะสร้างโพสต์: ' + err.message);
        } finally {
            // 8. คืนค่าปุ่มกลับเป็นปกติ
            genBtn.disabled = false;
            genBtn.classList.remove('loading');
            genBtn.textContent = 'สร้างโพสต์ใหม่';
        }
    }

    // --- ฟังก์ชันเริ่มต้น (Initialization) ---

    /**
     * สร้าง HTML ของ Modal และเพิ่มเข้าไปใน <body> (ทำครั้งเดียว)
     */
    function createModalHTML() {
        // ถ้ามีอยู่แล้ว ไม่ต้องสร้างซ้ำ
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
        // เพิ่ม HTML นี้เข้าไปท้ายสุดของ <body>
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // ผูก Event ให้ปุ่มปิด และปุ่มสร้าง
        document.getElementById('social-poster-modal-close').onclick = hideModal;
        document.getElementById('social-poster-generate-btn').onclick = generatePost;
        
        // คลิกที่พื้นหลังมืดๆ เพื่อปิด
        document.getElementById('social-poster-modal-overlay').onclick = (e) => {
            if (e.target.id === 'social-poster-modal-overlay') {
                hideModal();
            }
        };
    }

    /**
     * สร้างปุ่ม 💬 ในหน้าแชท
     */
    function addChatButton() {
        // ถ้ามีปุ่มอยู่แล้ว ไม่ต้องสร้างซ้ำ
        if (document.getElementById('social-poster-ext-btn')) return;

        // หาตำแหน่งที่จะแทรกปุ่ม (ลองหลายที่ เผื่อ ST อัปเดต)
        const mount = document.querySelector('.chat-input-container, .chat-controls, .st-user-input');
        if (!mount) {
            // ถ้ายังหาไม่เจอ ให้ลองใหม่ใน 1 วินาที
            setTimeout(addChatButton, 1000);
            return;
        }

        const container = document.createElement('div');
        container.id = 'social-poster-ext-container';
        
        const btn = document.createElement('button');
        btn.id = 'social-poster-ext-btn';
        btn.type = 'button';
        btn.textContent = '💬 โพสต์'; // ใช้ Emoji + Text ชัดเจนดี
        btn.title = 'ดู/สร้าง โพสต์โซเชียลของตัวละคร';
        btn.onclick = showModal; // คลิกเพื่อเปิด Modal

        container.appendChild(btn);
        mount.appendChild(container); // เพิ่มปุ่มเข้าไปในหน้า UI
    }

    /**
     * เริ่มต้นการทำงานของ Extension
     */
    function initializeExtension() {
        ensureSettings(); // โหลด/สร้าง settings
        createModalHTML(); // สร้างโครง Modal ที่ซ่อนไว้
        addChatButton(); // เพิ่มปุ่มแชท
    }

    // รอให้ SillyTavern โหลดเสร็จก่อน
    if (getCtx()?.eventSource && getCtx()?.event_types) {
         // วิธีที่ถูกต้อง: รอ event 'APP_READY'
         getCtx().eventSource.on(getCtx().event_types.APP_READY, () => initializeExtension());
    } else {
         // วิธีสำรอง: ถ้า ST เก่า หรือโหลดไม่ทัน
         document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeExtension, 1500); // หน่วงเวลาให้ ST โหลดเสร็จ
         });
    }

})();
