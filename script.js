(function() {
    const extensionName = 'roleplayPostGenerator';
    const defaultSettings = {
        enabled: true,
        platform: 'twitter',
        style: 'casual',
        maxLength: 280,
        autoGenerate: false,
        includeHashtags: true
    };

    // ฟังก์ชันโหลดการตั้งค่า
    function loadSettings() {
        const saved = localStorage.getItem(`${extensionName}_settings`);
        return saved ? {...defaultSettings, ...JSON.parse(saved)} : defaultSettings;
    }

    // ฟังก์ชันบันทึกการตั้งค่า
    function saveSettings(settings) {
        localStorage.setItem(`${extensionName}_settings`, JSON.stringify(settings));
    }

    // สร้าง UI สำหรับ extension
    function createUI() {
        const settings = loadSettings();
        
        // สร้างปุ่มในแถบเครื่องมือ
        const toolbar = document.getElementById('extensionsMenu');
        if (!toolbar) return;

        const button = document.createElement('button');
        button.innerHTML = '📱';
        button.title = 'สร้างโพสต์โซเชียลมีเดีย';
        button.className = 'menu_button';
        button.style.marginLeft = '5px';
        
        button.addEventListener('click', function() {
            openPostGenerator();
        });

        toolbar.appendChild(button);
    }

    // ฟังก์ชันเปิดตัวสร้างโพสต์
    function openPostGenerator() {
        const settings = loadSettings();
        
        // สร้าง modal
        const modal = document.createElement('div');
        modal.className = 'post-generator-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--SmartThemeBodyColor);
            border: 1px solid var(--SmartThemeBorderColor);
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            width: 500px;
            max-width: 90vw;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        // รับบทสนทนาล่าสุด
        const recentMessages = getRecentMessages(10);
        
        modal.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h3>สร้างโพสต์โซเชียลมีเดีย</h3>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>แพลตฟอร์ม:</label>
                <select id="postPlatform" style="margin-left: 10px;">
                    <option value="twitter" ${settings.platform === 'twitter' ? 'selected' : ''}>Twitter</option>
                    <option value="facebook" ${settings.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                    <option value="instagram" ${settings.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                </select>
            </div>

            <div style="margin-bottom: 15px;">
                <label>สไตล์:</label>
                <select id="postStyle" style="margin-left: 10px;">
                    <option value="casual" ${settings.style === 'casual' ? 'selected' : ''}>สบายๆ</option>
                    <option value="funny" ${settings.style === 'funny' ? 'selected' : ''}>ตลก</option>
                    <option value="dramatic" ${settings.style === 'dramatic' ? 'selected' : ''}>ดราม่า</option>
                    <option value="thoughtful" ${settings.style === 'thoughtful' ? 'selected' : ''}>ครุ่นคิด</option>
                </select>
            </div>

            <div style="margin-bottom: 15px;">
                <label>
                    <input type="checkbox" id="includeHashtags" ${settings.includeHashtags ? 'checked' : ''}>
                    รวมแฮชแท็ก
                </label>
            </div>

            <div style="margin-bottom: 15px;">
                <button id="generatePostBtn" class="menu_button">สร้างโพสต์</button>
                <button id="insertPostBtn" class="menu_button" style="display:none; margin-left: 10px;">แทรกในแชท</button>
            </div>

            <div id="generatedPost" style="
                background: var(--SmartThemeBlurTintColor);
                border: 1px solid var(--SmartThemeBorderColor);
                border-radius: 5px;
                padding: 15px;
                margin-top: 15px;
                min-height: 100px;
                white-space: pre-wrap;
                display: none;
            "></div>

            <div style="margin-top: 15px; text-align: right;">
                <button id="closeModal" class="menu_button">ปิด</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('generatePostBtn').addEventListener('click', function() {
            generatePost(recentMessages);
        });

        document.getElementById('closeModal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });

        // ป้องกันการคลิกนอก modal แล้วปิด
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // ฟังก์ชันรับข้อความล่าสุดจากแชท
    function getRecentMessages(count) {
        const messages = [];
        const messageElements = document.querySelectorAll('.mes:not(.swipe)');
        
        for (let i = Math.max(0, messageElements.length - count); i < messageElements.length; i++) {
            const element = messageElements[i];
            const isUser = element.classList.contains('mes_right');
            const name = element.querySelector('.mes_name')?.textContent || (isUser ? '{{user}}' : '{{char}}');
            const text = element.querySelector('.mes_text')?.textContent || '';
            
            if (text.trim()) {
                messages.push({
                    name: name,
                    text: text,
                    isUser: isUser
                });
            }
        }
        
        return messages;
    }

    // ฟังก์ชันสร้างโพสต์
    function generatePost(messages) {
        const platform = document.getElementById('postPlatform').value;
        const style = document.getElementById('postStyle').value;
        const includeHashtags = document.getElementById('includeHashtags').checked;
        
        const settings = loadSettings();
        settings.platform = platform;
        settings.style = style;
        settings.includeHashtags = includeHashtags;
        saveSettings(settings);

        // สร้างข้อความโพสต์
        const post = createPostContent(messages, platform, style, includeHashtags);
        
        const postElement = document.getElementById('generatedPost');
        const insertBtn = document.getElementById('insertPostBtn');
        
        postElement.textContent = post;
        postElement.style.display = 'block';
        insertBtn.style.display = 'inline-block';
        
        // อัพเดท event listener สำหรับปุ่มแทรก
        insertBtn.onclick = function() {
            insertPostToChat(post);
            document.querySelector('.post-generator-modal')?.remove();
        };
    }

    // ฟังก์ชันสร้างเนื้อหาโพสต์
    function createPostContent(messages, platform, style, includeHashtags) {
        const charName = getCharName();
        const recentContext = getConversationContext(messages);
        
        let post = '';
        const hashtags = includeHashtags ? generateHashtags(recentContext, style) : '';

        // สร้างโพสต์ตามสไตล์และแพลตฟอร์ม
        switch(style) {
            case 'funny':
                post = createFunnyPost(charName, recentContext);
                break;
            case 'dramatic':
                post = createDramaticPost(charName, recentContext);
                break;
            case 'thoughtful':
                post = createThoughtfulPost(charName, recentContext);
                break;
            default:
                post = createCasualPost(charName, recentContext);
        }

        // ปรับตามแพลตฟอร์ม
        if (platform === 'twitter') {
            post = truncatePost(post + (includeHashtags ? `\n\n${hashtags}` : ''), 280);
        } else {
            post = post + (includeHashtags ? `\n\n${hashtags}` : '');
        }

        return post;
    }

    // ฟังก์ชันสร้างโพสต์สไตล์สบายๆ
    function createCasualPost(charName, context) {
        const templates = [
            `แค่คิดถึงเรื่องที่เพิ่งคุยกับ ${context.userName || 'เขา'}... ${getRandomEmoji()}`,
            `บางครั้งการพูดคุยธรรมดาก็ทำให้วันนี้น่าสนใจขึ้นนะ ${getRandomEmoji()}\n\n"${context.lastUserMessage}"`,
            `เพิ่งคุยเรื่อง ${context.topic} กับ ${context.userName || 'ใครบางคน'}... น่าสนใจดี`,
            `ชีวิตประจำวัน: ${context.summary} ${getRandomEmoji()}`,
            `ไม่คิดว่าวันนี้จะได้คุยเรื่อง ${context.topic}... รู้สึก${getRandomFeeling()}`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    // ฟังก์ชันสร้างโพสต์สไตล์ตลก
    function createFunnyPost(charName, context) {
        const templates = [
            `ชีวิตฉันตอนนี้: "${context.lastCharMessage}" \n\nในขณะที่อีกฝ่าย: "${context.lastUserMessage}" ${getRandomEmoji()}`,
            `สรุปบทสนทนาวันนี้: ${context.summary} \n\n#ชีวิตมันช่างน่าขัน`,
            `บางครั้งฉันก็สงสัยว่า "${context.lastUserMessage}" นี่หมายความว่าอะไรกันแน่... ${getRandomEmoji()}`,
            `โปรดช่วยฉัน ฉันติดอยู่ในวงล้อบทสนทนาที่ว่า: "${context.topic}" ${getRandomEmoji()}`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    // ฟังก์ชันสร้างโพสต์สไตล์ดราม่า
    function createDramaticPost(charName, context) {
        const templates = [
            `ในความเงียบ... คำว่า "${context.lastUserMessage}" ยังดังก้องในใจ...`,
            `บางการสนทนาก็เปลี่ยนทุกอย่าง "${context.summary}"`,
            `คำพูดธรรมดาที่ไม่ธรรมดา... "${context.lastUserMessage}"`,
            `บทสนทนาวันนี้ทิ้งคำถามมากมายไว้ในใจ... เกี่ยวกับ ${context.topic}`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    // ฟังก์ชันสร้างโพสต์สไตล์ครุ่นคิด
    function createThoughtfulPost(charName, context) {
        const templates = [
            `คิดเกี่ยวกับเรื่อง ${context.topic}... "${context.lastUserMessage}" ทำให้ฉุกคิดอะไรบางอย่าง`,
            `บางครั้งการสนทนากับ ${context.userName || 'ใครสักคน'} ก็ให้มุมมองใหม่...`,
            `คำถามในวันนี้: ${context.lastUserMessage} \n\nคำตอบอาจจะต้องใช้เวลา...`,
            `ไตร่ตรองเกี่ยวกับ ${context.topic}... ชีวิตก็เป็นแบบนี้บ้างบางครั้ง`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    // ฟังก์ชันช่วยเหลือต่างๆ
    function getCharName() {
        return document.querySelector('.char_name')?.textContent || '{{char}}';
    }

    function getConversationContext(messages) {
        if (messages.length === 0) return { topic: 'ชีวิต', summary: 'ไม่มีอะไรใหม่' };
        
        const lastUserMessage = messages.filter(m => m.isUser).pop()?.text || '...';
        const lastCharMessage = messages.filter(m => !m.isUser).pop()?.text || '...';
        
        // สรุปบทสนทนาอย่างง่าย
        const userMessages = messages.filter(m => m.isUser).map(m => m.text);
        const commonWords = findCommonWords(userMessages);
        const topic = commonWords.length > 0 ? commonWords[0] : 'ชีวิต';
        
        return {
            lastUserMessage: truncateText(lastUserMessage, 50),
            lastCharMessage: truncateText(lastCharMessage, 50),
            topic: topic,
            summary: createSimpleSummary(messages),
            userName: messages.find(m => m.isUser)?.name || '{{user}}'
        };
    }

    function findCommonWords(texts) {
        const words = {};
        texts.forEach(text => {
            text.split(' ').forEach(word => {
                if (word.length > 2) {
                    words[word] = (words[word] || 0) + 1;
                }
            });
        });
        
        return Object.entries(words)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
    }

    function createSimpleSummary(messages) {
        if (messages.length === 0) return 'บทสนทนาธรรมดา';
        
        const lastFew = messages.slice(-3).map(m => 
            m.isUser ? `U: ${truncateText(m.text, 20)}` : `C: ${truncateText(m.text, 20)}`
        ).join(' → ');
        
        return lastFew;
    }

    function generateHashtags(context, style) {
        const baseTags = [`#${context.topic}`, '#บทบาท', '#SillyTavern'];
        const styleTags = {
            funny: ['#ตลก', '#ชีวิตประจำวัน', '#ฮา'],
            dramatic: ['#ดราม่า', '#ความรู้สึก', '#ลึกซึ้ง'],
            thoughtful: ['#ครุ่นคิด', '#ชีวิต', '#การเรียนรู้'],
            casual: ['#สบายๆ', '#วันธรรมดา', '#พูดคุย']
        };
        
        return [...baseTags, ...(styleTags[style] || [])].join(' ');
    }

    function getRandomEmoji() {
        const emojis = ['😊', '😂', '🤔', '😅', '🙂', '😌', '🤷‍♀️', '💭', '✨'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    function getRandomFeeling() {
        const feelings = ['ดี', 'แปลก', 'สุข', 'ประหลาดใจ', 'สงสัย'];
        return feelings[Math.floor(Math.random() * feelings.length)];
    }

    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function truncatePost(post, maxLength) {
        if (post.length <= maxLength) return post;
        return post.substring(0, maxLength - 3) + '...';
    }

    // ฟังก์ชันแทรกโพสต์ลงในแชท
    function insertPostToChat(post) {
        const chatInput = document.getElementById('send_textarea');
        if (chatInput) {
            const currentText = chatInput.value;
            chatInput.value = currentText + (currentText ? '\n\n' : '') + 
                `[โพสต์โซเชียลมีเดีย]\n${post}`;
            chatInput.focus();
            
            // Trigger input event เพื่ออัพเดท UI
            const event = new Event('input', { bubbles: true });
            chatInput.dispatchEvent(event);
        }
    }

    // เริ่มต้น extension เมื่อหน้าเว็บโหลดเสร็จ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }

    console.log('Roleplay Post Generator extension loaded successfully!');
})();
