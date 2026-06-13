import { useState, useRef, useCallback } from 'react';
import { AudioRecorder, AudioPlayer } from '@/lib/utils/audio-utils';
import { nanoid } from 'nanoid';

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function useRealtimeInterview() {
    const [status, setStatus] = useState<RealtimeStatus>('idle');
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [logs, setLogs] = useState<{ time: string, message: string }[]>([]);

    const [streamingContent, setStreamingContent] = useState<string>("");

    // Refs to keep track of instances without re-rendering
    const socketRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioPlayer | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    
    // Mute Control Ref (to be accessible inside AudioRecorder callback)
    const isMicMutedRef = useRef(false);

    const addLog = useCallback((message: string) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, { time, message }].slice(-100));
    }, []);

    const muteAudio = useCallback(() => {
        if (!isMicMutedRef.current) {
            isMicMutedRef.current = true;
            addLog("🔇 Mic Muted (Thinking Mode)");
        }
    }, [addLog]);

    const unmuteAudio = useCallback(() => {
        if (isMicMutedRef.current) {
            isMicMutedRef.current = false;
            addLog("🎤 Mic Unmuted (Listening)");
            setIsUserSpeaking(true); // Manual mode: User is speaking when unmuted
        }
    }, [addLog]);

    // Event Dispatcher
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleServerEvent = useCallback((event: any) => {
        switch (event.type) {
            case 'response.created':
                // Prepare for new response
                setStreamingContent("");
                break;

            case 'response.audio.delta':
                // AI is speaking audio chunks
                if (event.delta) {
                     // Convert Base64 delta to ArrayBuffer
                     const binaryString = window.atob(event.delta);
                     const len = binaryString.length;
                     const bytes = new Uint8Array(len);
                     for (let i = 0; i < len; i++) {
                         bytes[i] = binaryString.charCodeAt(i);
                     }
                     playerRef.current?.add16BitPCM(bytes.buffer);
                     // setIsAiSpeaking(true); // Handled by AudioPlayer callback
                }
                break;

            case 'response.audio_transcript.delta':
                // Streaming Text
                if (event.delta) {
                    setStreamingContent(prev => prev + event.delta);
                    // setIsAiSpeaking(true); // Handled by AudioPlayer callback
                }
                break;
            
            case 'input_audio_buffer.speech_started':
                // Server VAD detected user speech -> Interrupt AI!
                addLog("🎤 User Speech Started (VAD)");
                console.log("Interruption detected!");
                playerRef.current?.reset(); // Stop playing audio immediately
                setIsUserSpeaking(true);
                setIsAiSpeaking(false);
                setStreamingContent(""); // Clear interrupted text
                
                // Cancel current response on server
                socketRef.current?.send(JSON.stringify({ type: 'response.cancel' }));
                break;

            case 'input_audio_buffer.speech_stopped':
                 addLog("🤐 User Speech Stopped");
                 setIsUserSpeaking(false);
                 break;

            case 'response.audio_transcript.done':
                 // Final transcript of what AI said (Audio Mode)
                 if (event.transcript) {
                     addLog(`🤖 AI: "${event.transcript}"`);
                     setTranscript(prev => [...prev, { role: 'ai', text: event.transcript }]);
                     // setIsAiSpeaking(false); // Handled by AudioPlayer callback
                 }
                 break;

            // --- Support for Text-Only Mode (Anime/Remote TTS) ---
            case 'response.text.delta':
                if (event.delta) {
                    setStreamingContent(prev => prev + event.delta);
                    // setIsAiSpeaking(true); // Handled by AudioPlayer callback
                }
                break;

            case 'response.text.done':
                if (event.text) {
                    addLog(`🤖 AI (Text): "${event.text}"`);
                    setTranscript(prev => [...prev, { role: 'ai', text: event.text }]);
                    // setIsAiSpeaking(false); // Handled by AudioPlayer callback
                }
                break;

            case 'conversation.item.input_audio_transcription.completed':
                // Transcript of what User said
                 if (event.transcript) {
                     addLog(`👤 User: "${event.transcript}"`);
                     setTranscript(prev => [...prev, { role: 'user', text: event.transcript }]);
                 }
                 break;
            
            case 'error':
                 console.error("OpenAI Realtime Error:", event);
                 addLog(`🔥 Server Error: ${event.error?.message || JSON.stringify(event)}`);
                 break;
        }
    }, [addLog]);

    const cleanup = useCallback(() => {
        socketRef.current?.close();
        socketRef.current = null;
        recorderRef.current?.stop();
        recorderRef.current = null;
        playerRef.current?.reset();
        playerRef.current = null; 
        setIsUserSpeaking(false);
        setIsAiSpeaking(false);
        isMicMutedRef.current = false;
    }, []);

    const connect = useCallback(async (customSessionId?: string, config?: { apiKey?: string, baseUrl?: string, model?: string, sampleRate?: number }) => {
        if (status === 'connected' || status === 'connecting') return;
        
        setStatus('connecting');
        const sid = customSessionId || nanoid();
        sessionIdRef.current = sid;

        try {
            console.log("DEBUG: Initializing Audio & WebSocket connection...");
            addLog("🚀 Initializing Audio & WebSocket connection...");
            
            // Initialize Audio Logic first (requires user gesture usually)
            // Default to 24000 (OpenAI), unless overridden (e.g. 48000 for Remote/Anime)
            const playbackRate = config?.sampleRate || 24000;
            playerRef.current = new AudioPlayer(playbackRate, (isPlaying) => {
                setIsAiSpeaking(isPlaying);
            });
            
            recorderRef.current = new AudioRecorder((base64Audio) => {
                 if (socketRef.current?.readyState === WebSocket.OPEN && !isMicMutedRef.current) {
                     // Send Audio Append Event
                     const event = {
                         type: 'input_audio_buffer.append',
                         audio: base64Audio
                     };
                     socketRef.current.send(JSON.stringify(event));
                 }
            });
            await recorderRef.current.start();
            addLog("🎙️ Audio Capture Started");

            // Connect WebSocket - Direct connection to backend (bypasses Next.js rewrites)
            // Next.js rewrites don't support WebSocket protocol upgrades on Vercel
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
            const backendHost = backendUrl.replace(/^https?:\/\//, ''); // Remove protocol
            const protocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
            let wsUrl = `${protocol}//${backendHost}/api/interview/realtime/${sid}`;

            // Append Query Params
            const params = new URLSearchParams();
            if (config?.apiKey) params.append('api_key', config.apiKey);
            if (config?.baseUrl) params.append('base_url', config.baseUrl);
            if (config?.model) params.append('model', config.model);
            
            if (params.toString()) {
                wsUrl += `?${params.toString()}`;
            }

            console.log("DEBUG: Connecting to WebSocket URL:", wsUrl);
            addLog(`🔗 Connecting to: ${wsUrl}`);
            
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('DEBUG: Realtime WS Connected (onopen)');
                addLog('✅ Realtime WS Connected');
                setStatus('connected');
                // Send 'response.create' to trigger AI to speak first (Greeting)
                socket.send(JSON.stringify({ type: 'response.create' }));
            };

            socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                // Only log actual errors payload from server, ignore empty error ack
                if (data.type === 'error' && (data.error || data.message || Object.keys(data).length > 1)) {
                    console.error("DEBUG: Received Error Event from Server:", data);
                }
                handleServerEvent(data);
            };

            socket.onclose = (e) => {
                console.log('Realtime WS Closed');
                addLog(`❌ WS Closed: ${e.code} ${e.reason}`);
                setStatus('idle');
                cleanup();
            };

            socket.onerror = (err) => {
                console.error('Realtime WS Error', err);
                addLog("❌ WebSocket Error");
                setStatus('error');
            };

        } catch (error) {
            console.error("Failed to connect realtime:", error);
            addLog(`❌ Connection Failed: ${error}`);
            setStatus('error');
        }
    }, [status, cleanup, handleServerEvent, addLog]);

    const disconnect = useCallback(() => {
        addLog("⏹️ Disconnecting...");
        cleanup();
        setStatus('idle');
    }, [cleanup, addLog]);

    // Helper to send manual text if needed
    const sendText = (text: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
             socketRef.current.send(JSON.stringify({
                 type: 'conversation.item.create',
                 item: {
                     type: 'message',
                     role: 'user',
                     content: [{ type: 'input_text', text }]
                 }
             }));
             socketRef.current.send(JSON.stringify({ type: 'response.create' }));
             addLog(`📝 Sent Text: "${text}"`);
        }
    };

    const stopSpeakingAndResponse = useCallback(() => {
        muteAudio();
        // Commit the buffer and request response manually
        if (socketRef.current?.readyState === WebSocket.OPEN) {
             addLog("🛑 User Finished Speaking (Manual)");
             socketRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
             socketRef.current.send(JSON.stringify({ type: 'response.create' }));
        }
        setIsUserSpeaking(false);
    }, [addLog, muteAudio]);

    return {
        status,
        connect,
        disconnect,
        sendText,
        muteAudio,
        unmuteAudio,
        stopSpeakingAndResponse,
        isUserSpeaking,
        isAiSpeaking,
        transcript,
        streamingContent,
        logs // Export logs
    };
}
