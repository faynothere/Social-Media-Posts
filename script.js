// Roleplay Post Generator Extension for SillyTavern
// GitHub: https://github.com/yourusername/sillytavern-roleplay-post-generator

(function() {
    const extensionName = 'roleplayPostGenerator';
    let isInitialized = false;
    
    // ฟังก์ชันสำหรับโหลด CSS
    function loadCSS() {
        // ใช้ inline CSS แทนการโหลดจากไฟล์ภายนอก
        const css = `
            /* Roleplay Post Generator Extension Styles */
            .rpg-container {
                padding: 15px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 8px;
                background-color: #f9f9f9;
            }
            
            .rpg-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                padding: 10px 16px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 14px;
                font-weight: 600;
                margin: 4px 8px;
                cursor: pointer;
                border-radius: 20px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }
            
            .rpg-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .rpg-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.5);
                backdrop-filter: blur(5px);
            }
            
            .rpg-modal-content {
                background-color: #fefefe;
                margin: 2% auto;
                padding: 25px;
                border: none;
                width: 90%;
                max-width: 500px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .rpg-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            .rpg-close:hover {
                color: #333;
            }
            
            .rpg-tabs {
                display: flex;
                margin-bottom: 20px;
                border-bottom: 2px solid #e4e6ea;
                background: #f8f9fa;
                border-radius: 12px;
                padding: 4px;
            }
            
            .rpg-tab {
                flex: 1;
                padding: 12px 16px;
                cursor: pointer;
                text-align: center;
                border-radius: 8px;
                transition: all 0.3s ease;
                font-weight: 600;
                color: #65676b;
            }
            
            .rpg-tab.active {
                background: white;
                color: #1877f2;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .rpg-platform {
                display: none;
            }
            
            .rpg-platform.active {
                display: block;
            }
            
            .rpg-post {
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                transition: transform 0.2s ease;
            }
            
            .rpg-post:hover {
                transform: translateY(-2px);
            }
            
            .facebook-post {
                border-left: 4px solid #1877f2;
            }
            
            .twitter-post {
                border-left: 4px solid #1da1f2;
            }
            
            .instagram-post {
                border-left: 4px solid #e4405f;
            }
            
            .rpg-post-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .rpg-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                margin-right: 12px;
                object-fit: cover;
                border: 2px solid #e4e6ea;
            }
            
            .rpg-post-info {
                flex: 1;
            }
            
            .rpg-name {
                font-weight: bold;
                margin: 0 0 4px 0;
                color: #050505;
            }
            
            .rpg-username {
                color: #65676b;
                font-size: 13px;
                margin: 0 0 4px 0;
            }
            
            .rpg-time {
                color: #65676b;
                font-size: 12px;
                margin: 0;
            }
            
            .rpg-more {
                font-size: 20px;
                color: #65676b;
                cursor: pointer;
            }
            
            .rpg-post-content {
                margin: 15px 0;
                line-height: 1.5;
                color: #050505;
                font-size: 15px;
            }
            
            .rpg-post-actions {
                display: flex;
                border-top: 1px solid #eee;
                padding-top: 12px;
                margin-top: 15px;
            }
            
            .rpg-action {
                color: #65676b;
                margin-right: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: color 0.3s;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .rpg-action:hover {
                color: #1877f2;
            }
            
            .rpg-instagram-image {
                margin: 15px -20px;
                background: #f8f9fa;
                border-top: 1px solid #eee;
                border-bottom: 1px solid #eee;
            }
            
            .rpg-image-placeholder {
                height: 300px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 18px;
                font-weight: bold;
            }
            
            .rpg-post-time {
                color: #8e8e8e;
                font-size: 12px;
                margin-top: 8px;
            }
            
            .rpg-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            
            .rpg-refresh-btn, .rpg-copy-btn {
                background: #f0f2f5;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 13px;
                font-weight: 600;
            }
            
            .rpg-refresh-btn:hover, .rpg-copy-btn:hover {
                background: #e4e6ea;
                transform: translateY(-1px);
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .rpg-modal-content {
                    margin: 5% auto;
                    width: 95%;
                    padding: 20px;
                }
                
                .rpg-tabs {
                    flex-direction: column;
                }
                
                .rpg-actions {
                    flex-direction: column;
                }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // ฟังก์ชันสำหรับสร้างโพสต์
    function generatePost(charName, userName, recentMessages, platform) {
        const relevantMessages = recentMessages.slice(-8);
        let postContent = '';
        
        if (platform === 'facebook') {
            postContent = generateFacebookPost(charName, userName, relevantMessages);
        } else if (platform === 'twitter') {
            postContent = generateTwitterPost(charName, userName, relevantMessages);
        } else if (platform === 'instagram') {
            postContent = generateInstagramPost(charName, userName, relevantMessages);
        }
        
        return postContent;
    }
    
    function generateFacebookPost(charName, userName, messages) {
        const templates = [
            `โอ้ย... ${userName} ทำให้ฉันรู้สึกสับสนมากเลยตอนนี้ ใครเคยเจอสถานการณ์แบบนี้บ้าง?`,
            `เพิ่งคุยกับ ${userName} แล้วรู้สึกแบบ... ไม่อยากพูดมาก แต่มันซับซ้อนเกินบรรยาย`,
            `บางครั้งการคุยกับ ${userName} ก็ทำให้ฉันต้องคิดหนักเลยนะ โลกนี้ช่างซับซ้อนเสียจริง`,
            `มีใครเคยรู้สึกแบบนี้ไหม? หลังจากคุยกับ ${userName} แล้วรู้สึกว่าบางเรื่องมันก็อธิบายไม่ถูก`,
            `ชีวิตนี้ช่างมีเรื่องให้คิดไม่หยุดเลย... โดยเฉพาะหลังจากที่ได้คุยกับ ${userName}`
        ];
        
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        let conversationExcerpt = '';
        
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.mes) {
                const shortExcerpt = lastMessage.mes.substring(0, 50);
                conversationExcerpt = shortExcerpt.length === 50 ? ` "${shortExcerpt}..."` : ` "${shortExcerpt}"`;
            }
        }
        
        return randomTemplate + conversationExcerpt;
    }
    
    function generateTwitterPost(charName, userName, messages) {
        const templates = [
            `คุยกับ ${userName} แล้วรู้สึก... #สับสน #ชีวิต`,
            `บางครั้งก็ไม่รู้ว่าจะตอบ ${userName} ยังไงดี 🤔`,
            `ชีวิตหลังจากคุยกับ ${userName}... #คิดมาก`,
            `${userName} ทำให้ฉันต้องคิดหนักอีกแล้ว 💭`,
            `ไม่รู้ว่า ${userName} รู้สึกยังไงกับสิ่งที่ฉันพูดไป... #กังวล`
        ];
        
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        let conversationExcerpt = '';
        
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.mes) {
                const shortExcerpt = lastMessage.mes.substring(0, 30);
                conversationExcerpt = shortExcerpt.length === 30 ? ` "${shortExcerpt}..."` : ` "${shortExcerpt}"`;
            }
        }
        
        return randomTemplate + conversationExcerpt;
    }
    
    function generateInstagramPost(charName, userName, messages) {
        const templates = [
            `ช่วงนี้ชีวิตช่างน่าคิด... ✨ #ชีวิต #${userName.replace(/\s/g, '')}`,
            `บางเรื่องก็อธิบายไม่ถูกหลังจากคุยกับ ${userName} 🤔 #คิดมาก`,
            `ความรู้สึกตอนนี้... หลังจากได้คุยกับ ${userName} 💫`,
            `ชีวิตไม่เคยง่ายอย่างที่คิด 😌 #${userName.replace(/\s/g, '')} #ชีวิต`,
            `มุมมองใหม่หลังจากคุยกับ ${userName} 🌟`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    // ฟังก์ชันสำหรับแสดงโมดัลโพสต์
    function showPostsModal() {
        let modal = document.getElementById('rpg-modal');
        if (!modal) {
            createModal();
            modal = document.getElementById('rpg-modal');
        }
        
        const chat = window.chat;
        if (!chat || !chat.length) {
            toastr.error('ไม่มีบทสนทนาให้สร้างโพสต์');
            return;
        }
        
        const charName = window.this_chid ? (window.characters[window.this_chid]?.name || '{{char}}') : '{{char}}';
        const userName = window.getUserName?.() || '{{user}}';
        
        updatePostsContent(charName, userName, chat);
        modal.style.display = 'block';
    }
    
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'rpg-modal';
        modal.className = 'rpg-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'rpg-modal-content';
        
        modalContent.innerHTML = `
            <span class="rpg-close">&times;</span>
            <h2>📱 สร้างโพสต์จากบทสนทนา</h2>
            <div class="rpg-tabs">
                <div class="rpg-tab active" data-platform="facebook">Facebook</div>
                <div class="rpg-tab" data-platform="twitter">Twitter</div>
                <div class="rpg-tab" data-platform="instagram">Instagram</div>
            </div>
            <div class="rpg-platform active" id="rpg-facebook-posts"></div>
            <div class="rpg-platform" id="rpg-twitter-posts"></div>
            <div class="rpg-platform" id="rpg-instagram-posts"></div>
            <div class="rpg-actions">
                <button class="rpg-refresh-btn">🔄 สร้างโพสต์ใหม่</button>
                <button class="rpg-copy-btn" data-platform="facebook">📋 คัดลอก Facebook</button>
                <button class="rpg-copy-btn" data-platform="twitter">📋 คัดลอก Twitter</button>
                <button class="rpg-copy-btn" data-platform="instagram">📋 คัดลอก Instagram</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.rpg-close').onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.querySelectorAll('.rpg-tab').forEach(tab => {
            tab.onclick = () => switchTab(tab.dataset.platform);
        });
        
        modal.querySelector('.rpg-refresh-btn').onclick = () => {
            const chat = window.chat;
            if (chat && chat.length) {
                const charName = window.this_chid ? (window.characters[window.this_chid]?.name || '{{char}}') : '{{char}}';
                const userName = window.getUserName?.() || '{{user}}';
                updatePostsContent(charName, userName, chat);
            }
        };
        
        modal.querySelectorAll('.rpg-copy-btn').forEach(btn => {
            btn.onclick = () => copyPostToClipboard(btn.dataset.platform);
        });
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    function switchTab(platform) {
        document.querySelectorAll('.rpg-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.platform === platform);
        });
        
        document.querySelectorAll('.rpg-platform').forEach(content => {
            content.classList.toggle('active', content.id === `rpg-${platform}-posts`);
        });
    }
    
    function updatePostsContent(charName, userName, chat) {
        const platforms = ['facebook', 'twitter', 'instagram'];
        
        platforms.forEach(platform => {
            const postContent = generatePost(charName, userName, chat, platform);
            const container = document.getElementById(`rpg-${platform}-posts`);
            if (container) {
                container.innerHTML = createPostHTML(charName, postContent, platform);
            }
        });
    }
    
    function createPostHTML(charName, content, platform) {
        const now = new Date();
        let timeString, avatarUrl;
        
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(charName)}&background=random&size=64`;
        
        switch(platform) {
            case 'facebook':
                timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} · ${now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
                return `
                    <div class="rpg-post facebook-post">
                        <div class="rpg-post-header">
                            <img src="${avatarUrl}" alt="${charName}" class="rpg-avatar">
                            <div class="rpg-post-info">
                                <p class="rpg-name">${charName}</p>
                                <p class="rpg-time">${timeString}</p>
                            </div>
                        </div>
                        <div class="rpg-post-content">
                            ${content}
                        </div>
                        <div class="rpg-post-actions">
                            <span class="rpg-action">👍 ถูกใจ</span>
                            <span class="rpg-action">💬 แสดงความคิดเห็น</span>
                            <span class="rpg-action">🔄 แชร์</span>
                        </div>
                    </div>
                `;
                
            case 'twitter':
                timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} · ${now.getDate()} ${now.toLocaleDateString('th-TH', { month: 'short' })} ${now.getFullYear() + 543}`;
                return `
                    <div class="rpg-post twitter-post">
                        <div class="rpg-post-header">
                            <img src="${avatarUrl}" alt="${charName}" class="rpg-avatar">
                            <div class="rpg-post-info">
                                <p class="rpg-name">${charName}</p>
                                <p class="rpg-username">@${charName.toLowerCase().replace(/\s/g, '')}</p>
                                <p class="rpg-time">${timeString}</p>
                            </div>
                        </div>
                        <div class="rpg-post-content">
                            ${content}
                        </div>
                        <div class="rpg-post-actions">
                            <span class="rpg-action">💬</span>
                            <span class="rpg-action">🔄</span>
                            <span class="rpg-action">❤️</span>
                            <span class="rpg-action">📤</span>
                        </div>
                    </div>
                `;
                
            case 'instagram':
                timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
                return `
                    <div class="rpg-post instagram-post">
                        <div class="rpg-post-header">
                            <img src="${avatarUrl}" alt="${charName}" class="rpg-avatar">
                            <div class="rpg-post-info">
                                <p class="rpg-name">${charName}</p>
                            </div>
                            <span class="rpg-more">⋯</span>
                        </div>
                        <div class="rpg-instagram-image">
                            <div class="rpg-image-placeholder">
                                📱 ${charName}
                            </div>
                        </div>
                        <div class="rpg-post-actions">
                            <span class="rpg-action">❤️</span>
                            <span class="rpg-action">💬</span>
                            <span class="rpg-action">📤</span>
                            <span class="rpg-action">🔖</span>
                        </div>
                        <div class="rpg-post-content">
                            <span class="rpg-name">${charName}</span> ${content}
                        </div>
                        <div class="rpg-post-time">${timeString}</div>
                    </div>
                `;
        }
    }
    
    function copyPostToClipboard(platform) {
        const container = document.getElementById(`rpg-${platform}-posts`);
        if (!container) return;
        
        const postContent = container.querySelector('.rpg-post-content');
        const text = postContent.textContent || postContent.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            if (window.toastr) {
                toastr.success(`คัดลอกโพสต์ ${platform} เรียบร้อยแล้ว!`);
            } else {
                console.log(`คัดลอกโพสต์ ${platform} เรียบร้อยแล้ว!`);
            }
        }).catch(err => {
            if (window.toastr) {
                toastr.error('ไม่สามารถคัดลอกได้');
            }
            console.error('Copy failed:', err);
        });
    }
    
    function addButtonToUI() {
        const checkExist = setInterval(() => {
            const sendButton = document.getElementById('send_but');
            if (sendButton && !document.getElementById('rpg-generate-button')) {
                clearInterval(checkExist);
                
                const button = document.createElement('button');
                button.id = 'rpg-generate-button';
                button.className = 'rpg-button';
                button.innerHTML = '📝 สร้างโพสต์';
                button.title = 'สร้างโพสต์จากบทสนทนาล่าสุด';
                button.onclick = showPostsModal;
                
                sendButton.parentNode.insertBefore(button, sendButton);
                
                console.log('✅ Roleplay Post Generator - ปุ่มถูกเพิ่มเรียบร้อยแล้ว');
            }
        }, 500);
    }
    
    // เริ่มต้น extension
    function initializeExtension() {
        if (isInitialized) return;
        
        console.log('🎮 Roleplay Post Generator Extension กำลังโหลด...');
        
        // โหลด CSS
        loadCSS();
        
        // เพิ่มปุ่มใน UI
        addButtonToUI();
        
        isInitialized = true;
        console.log('✅ Roleplay Post Generator Extension โหลดเสร็จแล้ว!');
    }
    
    // รอจนกว่า SillyTavern จะโหลดเสร็จ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        setTimeout(initializeExtension, 1000);
    }
    
    // Export สำหรับ SillyTavern Extension System
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            name: extensionName,
            initialize: initializeExtension
        };
    }
})();
