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



// BIẾN SINH TỒN

let shouldReconnect = true; 



function createBot() {

    const bot = mineflayer.createBot({

        host: 'aemine.vn',

        port: 25565,

        username: 'winlxag5555', 

        version: '1.12.2',

        viewDistance: 'tiny' // Ép bot giảm tải RAM

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



        const isKilledByPlayer = message.includes('winlxag5553') && 

                                 (message.toLowerCase().includes('slain by') || 

                                  message.toLowerCase().includes('slained by') || 

                                  message.toLowerCase().includes('giết'));

        

        if (isKilledByPlayer) {

            console.log('[RÚT LUI KHẨN CẤP] Bị KS! Bãi đã có chủ. Tắt bot ngay!');

            shouldReconnect = false; 

            bot.quit(); 

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

            console.log('[Menu] Thành công! Đợi 15 giây cho map load mượt (Chống lag 6h sáng)...');

            // Đã đổi thành 15 giây đợi load map

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

        if (!shouldReconnect) {

            console.log('[SHUTDOWN] Đã rút điện bot vì bị KS!');

            return;

        }



        botState = 'HUB'; 

        isLoggingIn = false;

        isComboRunning = false;

        if (antiAfkLoop) clearInterval(antiAfkLoop); 

        if (clickLoop) clearInterval(clickLoop);



        console.log('[Mất mạng/Reset] Đang đợi 2 phút để server nhả acc rồi vào lại...');

        setTimeout(createBot, 120000); 

    });



    bot.on('error', err => console.log('[Lỗi Minecraft]:', err.message));

}



// ====================================================

// 6. KỊCH BẢN FARM (FIX LỖI NGỒI Ở SPAWN + GIÃN NHỊP COMBO)

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

        await randomSleep(6000, 8000); // Đợi load map spawn



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



        console.log('[Farm] Đang về nhà /home... Đợi load map...');

        bot.chat('/home');

        

        // CHỐT CHẶN CUỐI CÙNG: Đợi 8 đến 10 giây để chắc chắn đã về đến nhà mới ngồi

        await randomSleep(8000, 10000); 

        

        console.log('[Farm] Đã về đến nhà, an tọa /sit...');

        bot.chat('/sit');



        if (antiAfkLoop) clearInterval(antiAfkLoop);

        antiAfkLoop = setInterval(() => {

            if (botState === 'FARMING' && !isComboRunning) {

                bot.swingArm('right'); 

            }

        }, 240000); 

        

    } catch (err) {

        console.log('[Farm] Lỗi:', err.message);

    } finally {

        isComboRunning = false; 

    }

}



createBot();
