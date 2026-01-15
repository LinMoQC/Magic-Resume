// src/lib/audio-utils.ts

// OpenAI Realtime API typically uses 24kHz mono PCM16
const SAMPLE_RATE = 24000;

export class AudioRecorder {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private onDataAvailable: (base64Audio: string) => void;

    constructor(onData: (base64Audio: string) => void) {
        this.onDataAvailable = onData;
    }

    async start() {
        if (this.stream) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    channelCount: 1, 
                    echoCancellation: true, 
                    autoGainControl: true, 
                    noiseSuppression: true 
                } 
            });
            this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

            await this.audioContext.audioWorklet.addModule(
                'data:text/javascript;base64,' + btoa(`
                    class PCMProcessor extends AudioWorkletProcessor {
                        process(inputs, outputs, parameters) {
                            const input = inputs[0];
                            if (input.length > 0) {
                                const float32Data = input[0];
                                const int16Data = new Int16Array(float32Data.length);
                                for (let i = 0; i < float32Data.length; i++) {
                                    const s = Math.max(-1, Math.min(1, float32Data[i]));
                                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                                }
                                this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
                            }
                            return true;
                        }
                    }
                    registerProcessor('pcm-processor', PCMProcessor);
                `)
            );

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

            this.workletNode.port.onmessage = (event) => {
                const int16Data = new Int16Array(event.data);
                if (int16Data.length > 0) {
                     // Convert to Base64
                     const base64 = this.arrayBufferToBase64(int16Data.buffer);
                     this.onDataAvailable(base64);
                }
            };

            this.source.connect(this.workletNode);
            // Worklet doesn't need destination if just processing
        } catch (error) {
            console.error("Error starting audio recording:", error);
            throw error;
        }
    }

    stop() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode.port.close();
            this.workletNode = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

export class AudioPlayer {
    private audioContext: AudioContext;
    private nextStartTime: number = 0;
    private scheduledSources: AudioBufferSourceNode[] = [];

    constructor() {
        this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    }

    reset() {
        // Stop all scheduled sources to interrupt immediately
        this.scheduledSources.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        this.scheduledSources = [];
        this.nextStartTime = this.audioContext.currentTime;
    }

    add16BitPCM(arrayBuffer: ArrayBuffer) {
        if (this.audioContext.state === 'suspended') {
             this.audioContext.resume();
        }

        const int16Data = new Int16Array(arrayBuffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            const intC = int16Data[i];
            float32Data[i] = intC < 0 ? intC / 0x8000 : intC / 0x7FFF;
        }

        const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, SAMPLE_RATE);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        const currentTime = this.audioContext.currentTime;
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime + 0.05; 
        }

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;

        source.onended = () => {
             this.scheduledSources = this.scheduledSources.filter(s => s !== source);
        };
        
        this.scheduledSources.push(source);
    }
}
