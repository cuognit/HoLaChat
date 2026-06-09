import { useEffect, useRef } from 'react';

export const useWebAudioRingtone = (isRinging, type = 'callee') => {
    const audioCtxRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!isRinging) {
            cleanup();
            return;
        }

        let isRunning = true;
        const playRingtone = async () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                audioCtxRef.current = ctx;

                // Cần resume nếu browser block
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }

                const playTone = () => {
                    if (!isRunning) return;
                    const osc1 = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const gainNode = ctx.createGain();

                    osc1.connect(gainNode);
                    osc2.connect(gainNode);
                    gainNode.connect(ctx.destination);

                    if (type === 'callee') {
                        // Người nhận: Tiếng chuông reo dồn dập (ví dụ ĐT bàn)
                        osc1.frequency.value = 440;
                        osc2.frequency.value = 480;
                        
                        osc1.start(ctx.currentTime);
                        osc2.start(ctx.currentTime);
                        
                        gainNode.gain.setValueAtTime(0, ctx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                        gainNode.gain.setValueAtTime(0.5, ctx.currentTime + 1.5);
                        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);
                        
                        osc1.stop(ctx.currentTime + 1.6);
                        osc2.stop(ctx.currentTime + 1.6);
                    } else {
                        // Người gọi: Tiếng "tút... tút..." (dial tone)
                        osc1.frequency.value = 425;
                        osc2.frequency.value = 425;

                        osc1.start(ctx.currentTime);
                        osc2.start(ctx.currentTime);

                        gainNode.gain.setValueAtTime(0, ctx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
                        gainNode.gain.setValueAtTime(0.2, ctx.currentTime + 1.0);
                        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.05);

                        osc1.stop(ctx.currentTime + 1.1);
                        osc2.stop(ctx.currentTime + 1.1);
                    }
                };

                playTone();
                // Lặp lại chu kỳ
                const cycleTime = type === 'callee' ? 3000 : 4000;
                intervalRef.current = setInterval(playTone, cycleTime);

            } catch (err) {
                console.warn("Web Audio API không hoạt động:", err);
            }
        };

        // Kích hoạt ngay (cần user đã tương tác với trang trước đó, ví dụ click nút Gọi)
        playRingtone();

        return () => {
            isRunning = false;
            cleanup();
        };
    }, [isRinging, type]);

    const cleanup = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
    };
};
