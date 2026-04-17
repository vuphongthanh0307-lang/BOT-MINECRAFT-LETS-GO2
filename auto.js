const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER (CHỐNG SLEEP)
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot của Wind đang Farm VIP Pro!'));
app.listen(port, () => console.log(`[Web] Server đang chạy trên port ${port}`));

// KHIÊN BẤT TỬ
process.on('uncaughtException', (err) => console.log('[Khiên Bất Tử] Chặn lỗi:', err.message));
process.on('unhandledRejection', (err) => console.log('[Khiên Bất Tử] Lỗi Promise:', err.message));

// HÀM NGỦ CHỐNG SPAM
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomSleep = (min, max) => sleep(Math.floor(Math.random() * (max - min + 1) + min));

// CÁC BIẾN QUẢN LÝ TRẠNG THÁI
let botState = 'HUB'; 
let clickLoop; 
let antiAfkLoop; 
let isLoggingIn = false; 
let isComboRunning = false; 

// BIẾN SINH TỒN & NGỦ ĐÔNG
let shouldReconnect = true; 
let failCount = 0; 

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5555', // <--- ĐỔI TÊN NICK Ở ĐÂY NHA
        version: '1.12.2',
        viewDistance: 'tiny', 
        checkTimeoutInterval: 90000 
    });

    bot.on('spawn', async () => {
        if (botState === 'HUB' && !isLoggingIn) {
            isLoggingIn = true;
            console.log('[Hub] Đã vào sảnh, chuẩn bị đăng nhập...');
            await sleep(2000);
            bot.chat('/l Windvu2193'); 
            await sleep(6000); 

            console.log('[Hub] Cầm La bàn lên tay...');
            bot.setQuickBarSlot(4); 
            await sleep(1000);
            
            if (clickLoop) clearInterval(clickLoop);
            clickLoop = setInterval(() => {
                if (botState === 'HUB') {
                    console.log(`[Hub] Đang click La bàn...`);
                    bot.activateItem(); 
                } else {
                    clearInterval(clickLoop);
                }
            }, 2500); 
        }
    });

    bot.on('messagestr', (message) => {
        if (message.includes('/pt join')) {
            const match = message.match(/\/pt join (\S+)/);
            if (match) {
                const partyId = match[1]; 
                console.log(`[Party] Phát hiện lời mời! ID: ${partyId}`);
                bot.chat(`/party join ${partyId}`);
            }
        }

        // === BẢN VÁ 1: TỰ ĐỘNG LẤY TÊN BOT ĐANG CHẠY CHỨ KHÔNG GHI CỨNG NỮA ===
        const isKilledByPlayer = message.includes(bot.username) && 
                                 (message.toLowerCase().includes('slain by') || 
                                  message.toLowerCase().includes('slained by') || 
                                  message.toLowerCase().includes('giết'));
        
        if (isKilledByPlayer) {
            console.log('[RÚT LUI KHẨN CẤP] Bị KS! Bãi đã có chủ. Tắt bot ngay!');
            shouldReconnect = false; 
            bot.quit(); 
        }

        if (message.includes('không thể ngồi trong không khí')) {
            console.log('[Sit Guard] Server báo lỗi lơ lửng! Đợi load 3 giây rồi ngồi lại...');
            setTimeout(() => {
                if (botState === 'FARMING') bot.chat('/sit');
            }, 3000);
        }
    });

    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        if (clickLoop) clearInterval(clickLoop);

        try {
            await sleep(3000); 
            console.log(`[Menu 1] Nhấp slot 20...`);
            await bot.clickWindow(20, 0, 0); 

            await sleep(2500); 
            console.log(`[Menu 2] Nhấp slot 14...`);
            await bot.clickWindow(14, 0, 0); 
            
            botState = 'FARMING'; 
            console.log('[Menu] Thành công! Đợi 15 giây cho map load mượt...');
            setTimeout(() => startFarmingProcess(bot), 15000); 
        } catch (err) {
            console.log('Lỗi click GUI:', err.message);
        }
    });

    bot.on('death', async () => {
        if (!shouldReconnect) return; 
        console.log('[Chết] Bị quái cắn hoặc té chết! Đang hồi sinh...');
        isComboRunning = false; 
        bot.clearControlStates(); 
        await sleep(5000); 
        startFarmingProcess(bot);
    });

    bot.on('kicked', (reason) => {
        console.log(`[Bị Kick] Server đá ra ngoài! Lý do: ${reason}`);
    });

    bot.on('end', () => {
        // === BẢN VÁ 2: ĐẬP VỠ ĐỒNG HỒ SIT GUARD KHI RÚT ĐIỆN ===
        if (!shouldReconnect) {
            console.log('[SHUTDOWN] Đã rút điện bot vì bị KS!');
            if (antiAfkLoop) clearInterval(antiAfkLoop); // Xóa linh hồn múa tay
            if (clickLoop) clearInterval(clickLoop);
            return; 
        }

        botState = 'HUB'; 
        isLoggingIn = false;
        isComboRunning = false;
        if (antiAfkLoop) clearInterval(antiAfkLoop); 
        if (clickLoop) clearInterval(clickLoop);

        failCount++; 
        
        if (failCount >= 5) {
            console.log(`[BÁO ĐỘNG] Đã rớt mạng ${failCount} lần liên tục!`);
            console.log('[NGỦ ĐÔNG] Tạm nghỉ 1 tiếng để tránh bị ban IP...');
            failCount = 0; 
            setTimeout(createBot, 3600000); 
            return;
        }

        console.log(`[Mất mạng] Lần rớt thứ ${failCount}. Đang đợi 2 phút để vào lại...`);
        setTimeout(createBot, 120000); 
    });

    bot.on('error', err => console.log('[Lỗi Minecraft]:', err.message));
}

// ====================================================
// 6. KỊCH BẢN FARM
// ====================================================
async function startFarmingProcess(bot) {
    if (isComboRunning) return; 
    isComboRunning = true;

    try {
        console.log('[Farm] Đang dọn dẹp Party cũ...');
        bot.chat('/party quit'); 
        await randomSleep(1500, 2000);

        console.log('[Farm] Thử vào lại Party mặc định (18110998125)...');
        bot.chat('/party join 18110998125');
        await randomSleep(2000, 3000); 
        
        console.log('[Farm] Chuẩn bị đồ nghề: Chọn ô số 1 trên tay...');
        bot.setQuickBarSlot(0); 
        await randomSleep(1000, 1500);

        console.log('[Farm] Ra /spawn...');
        bot.chat('/spawn');
        await randomSleep(6000, 8000); 

        console.log('[Farm] Bắt đầu chuỗi Combo...');
        bot.setControlState('sneak', true); 
        await randomSleep(800, 1200); 
        bot.swingArm('right'); 
        await randomSleep(600, 1000);
        bot.activateItem(); 
        await randomSleep(600, 1000);
        bot.activateItem(); 
        await randomSleep(600, 1000);
        bot.activateItem(); 
        await randomSleep(1000, 1500);

        bot.clearControlStates(); 
        await randomSleep(2000, 3000); 

        console.log('[Farm] Đang về nhà /home...');
        bot.chat('/home');
        await randomSleep(5000, 7000); 
        
        console.log('[Farm] Gõ lệnh /sit...');
        bot.chat('/sit');

        failCount = 0; 

        if (antiAfkLoop) clearInterval(antiAfkLoop);
        antiAfkLoop = setInterval(() => {
            if (botState === 'FARMING' && !isComboRunning) {
                console.log('[Sit Guard] Đang vung tay chống AFK và kiểm tra dáng ngồi...');
                bot.swingArm('right'); 
                
                setTimeout(() => {
                    if (bot.chat) bot.chat('/sit');
                }, 1000);
            }
        }, 120000); 
        
    } catch (err) {
        console.log('[Farm] Lỗi:', err.message);
    } finally {
        isComboRunning = false; 
    }
}

createBot();
