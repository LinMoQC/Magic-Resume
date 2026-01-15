import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Mic, Square, ChevronLeft, Code2, Server, Globe, Users, Timer, Volume2, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resume } from '@/store/useResumeStore';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { interviewApi } from '@/lib/api/interview';
import { useSettingStore } from '@/store/useSettingStore';
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview';

type InterviewTabProps = {
    resumeData: Resume;
    isAiJobRunning: boolean;
    setIsAiJobRunning: (isRunning: boolean) => void;
};

type InterviewRole = 'frontend' | 'backend' | 'fullstack' | 'hr';

type InterviewStep = 'selection' | 'config' | 'interview';

type InterviewConfig = {
    thinkingTime: number; // 0, 10, 30
    avatarId: 'anime';
    voiceId: string;
};

const ROLES_CONFIG = [
    { key: 'frontend', icon: <Code2 size={32} className="text-cyan-400" />, color: "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500" },
    { key: 'backend', icon: <Server size={32} className="text-emerald-400" />, color: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500" },
    { key: 'fullstack', icon: <Globe size={32} className="text-purple-400" />, color: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500" },
    { key: 'hr', icon: <Users size={32} className="text-rose-400" />, color: "bg-rose-500/10 border-rose-500/20 hover:border-rose-500" },
] as const;

const AVATAR_OPTIONS = [
    { id: 'anime', name: '二次元 (Anime)', src: '/anime-interviewer.png' },
];

const VOICE_OPTIONS = [
    { id: 'alloy', name: 'Alloy (中性)' },
    { id: 'echo', name: 'Echo (沉稳男声)' },
    { id: 'shimmer', name: 'Shimmer (亲切女声)' },
];


// --- Cartoon Digital Human Component ---
const CartoonAvatar = ({ isSpeaking }: { isSpeaking: boolean }) => {
    return (
        <div className="relative w-48 h-48 md:w-60 md:h-60 mx-auto mb-10">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-3xl transition-all duration-500 ${isSpeaking ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`} />

            {/* Avatar Container */}
            <div className="relative w-full h-full bg-[#FFDFC4] rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-neutral-800 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">

                {/* Hair (Simple) */}
                <div className="absolute top-0 w-full h-16 bg-neutral-800" />

                {/* Face Elements */}
                <div className="relative z-10 flex flex-col items-center gap-8 mt-4">
                    {/* Eyes */}
                    <div className="flex gap-8">
                        {/* Left Eye */}
                        <div className="relative w-3 h-8 md:w-4 md:h-10 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute w-full bg-[#FFDFC4]"
                                initial={{ height: "0%" }}
                                animate={{ height: ["0%", "100%", "0%"] }}
                                transition={{ repeat: Infinity, duration: 4, repeatDelay: Math.random() * 3 }}
                                style={{ top: 0 }}
                            />
                        </div>
                        {/* Right Eye */}
                        <div className="relative w-3 h-8 md:w-4 md:h-10 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute w-full bg-[#FFDFC4]"
                                initial={{ height: "0%" }}
                                animate={{ height: ["0%", "100%", "0%"] }}
                                transition={{ repeat: Infinity, duration: 4, repeatDelay: Math.random() * 3 }}
                                style={{ top: 0 }}
                            />
                        </div>
                    </div>

                    {/* Mouth */}
                    <motion.div
                        className="bg-red-400 rounded-full"
                        animate={{
                            width: isSpeaking ? [20, 30, 25, 35, 20] : 20,
                            height: isSpeaking ? [10, 20, 15, 25, 10] : 6,
                            borderRadius: isSpeaking ? "50%" : "20px"
                        }}
                        transition={{
                            duration: 0.2,
                            repeat: isSpeaking ? Infinity : 0
                        }}
                        style={{ width: 20, height: 6 }}
                    />
                </div>

                {/* Body/Clothes hint */}
                <div className="absolute bottom-0 w-32 h-12 bg-sky-600 rounded-t-3xl" />
            </div>
        </div>
    );
}

export default function InterviewTab({ resumeData, isAiJobRunning, setIsAiJobRunning }: InterviewTabProps) {
    const { t } = useTranslation();
    const { apiKey, baseUrl, model } = useSettingStore();

    // Workflow State
    const [step, setStep] = useState<InterviewStep>('selection');
    const [configStep, setConfigStep] = useState<'voice' | 'avatar'>('voice');
    const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);
    const [config, setConfig] = useState<InterviewConfig>({
        thinkingTime: 10,
        avatarId: 'anime',
        voiceId: 'shimmer',
    });

    const { status, connect, disconnect, sendText, isUserSpeaking, isAiSpeaking, transcript: realtimeTranscript, logs, streamingContent, muteAudio, unmuteAudio } = useRealtimeInterview();
    const [showLogs, setShowLogs] = useState(false);

    // Effect to auto-scroll subtitles or handle status changes
    useEffect(() => {
        if (status === 'error') {
            // Handle error state
        }
    }, [status]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    const startRealInterview = async () => {
        try {
            setStep('interview');

            // 1. Initialize Backend Session (Upload Resume Context)
            console.log("Initializing Interview Session via API...");
            const sessionData = await interviewApi.start({
                resume_context: JSON.stringify(resumeData),
                role: selectedRole || 'general',
                config: {
                    ...config,
                    apiKey,
                    baseUrl,
                    modelName: model,
                    mode: 'realtime'
                }
            });

            if (!sessionData.session_id) {
                throw new Error("Failed to get session ID from backend");
            }

            console.log("Session Created:", sessionData.session_id);

            // 2. Connect via WebSocket using the Session ID
            await connect(sessionData.session_id, {
                apiKey,
                baseUrl,
                // Force the correct realtime model. Global 'model' setting is usually for Chat/Resume.
                model: 'gpt-4o-realtime-preview-2024-10-01'
            });

        } catch (error) {
            console.error("Failed to start interview:", error);
            // You might want to show a toast here in a real app
        }
    };

    // Derived state for UI compatibility
    const isListening = isUserSpeaking;
    const isConnecting = status === 'connecting';

    // Determine what text to display: Prioritize streaming content (AI speaking) -> then fallback to last transcript
    const lastSummary = realtimeTranscript.length > 0 ? realtimeTranscript[realtimeTranscript.length - 1] : null;
    const displayItem = streamingContent ? { role: 'ai', text: streamingContent } : lastSummary;

    // --- Thinking Time Logic ---
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const wasAiSpeakingRef = useRef(false);

    // Watch for AI finish speaking to trigger countdown
    useEffect(() => {
        if (wasAiSpeakingRef.current && !isAiSpeaking && config.thinkingTime > 0) {
            setTimeLeft(config.thinkingTime);
            muteAudio(); // Block VAD during thinking time
        }
        wasAiSpeakingRef.current = isAiSpeaking;
    }, [isAiSpeaking, config.thinkingTime, muteAudio]);

    // Countdown Timer
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            setTimeLeft(null);
            unmuteAudio(); // Re-enable VAD when time is up
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, unmuteAudio]);

    // Auto-cancel timer if user starts speaking (VAD)
    // Note: Since we mute audio, this shouldn't trigger, but acts as a fallback if unmute happens elsewhere
    useEffect(() => {
        if (isUserSpeaking) setTimeLeft(null);
    }, [isUserSpeaking]);

    // Manual Text Input Handler
    const handleSend = (text: string) => {
        if (!text.trim()) return;
        sendText(text);
        setTimeLeft(null);
        unmuteAudio();
    };

    // Toggle Listening
    const toggleListening = () => {
        // If timer is running, clicking mic cancels it (start answering early)
        if (timeLeft !== null) {
            setTimeLeft(null);
            unmuteAudio(); // Re-enable VAD immediately
            return;
        }
        // Todo: Implement mute
        console.log("Toggle mute not implemented yet");
    };

    // --- Render Selection Screen ---

    // Triggered by role selection
    const startConfig = (role: InterviewRole) => {
        setSelectedRole(role);
        setStep('config');
        setConfigStep('voice');
    };

    // --- Render Selection Screen ---
    if (step === 'selection') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300 -mt-8">
                <h2 className="text-2xl font-bold text-white mb-8">
                    {t('modals.aiModal.interviewTab.roles.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {ROLES_CONFIG.map((role) => (
                        <button
                            key={role.key}
                            onClick={() => startConfig(role.key as InterviewRole)}
                            className={`p-6 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden ${role.color}`}
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                {role.icon}
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-200 group-hover:text-white">
                                        {t(`modals.aiModal.interviewTab.roles.${role.key}.name`)}
                                    </h3>
                                    <p className="text-sm text-neutral-400 group-hover:text-neutral-300">
                                        {t(`modals.aiModal.interviewTab.roles.${role.key}.description`)}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Render Configuration Screen ---
    if (step === 'config') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-4 left-0 z-20">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (configStep === 'avatar') setConfigStep('voice');
                            else setStep('selection');
                        }}
                        className="text-neutral-400 hover:text-white"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        {t('modals.aiModal.interviewTab.back')}
                    </Button>
                </div>

                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait">
                        {configStep === 'voice' ? (
                            <motion.div
                                key="voice-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-white mb-2">声音与节奏</h2>
                                    <p className="text-neutral-400">配置面试官的语音风格和思考时间</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Thinking Time */}
                                    <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Timer className="w-5 h-5 text-sky-400" />
                                            <Label className="text-lg font-semibold text-neutral-200">思考时间</Label>
                                        </div>
                                        <RadioGroup
                                            value={config.thinkingTime.toString()}
                                            onValueChange={(val: string) => setConfig({ ...config, thinkingTime: parseInt(val) })}
                                            className="grid grid-cols-3 gap-2"
                                        >
                                            {[0, 10, 30].map((time) => (
                                                <div key={time}>
                                                    <RadioGroupItem value={time.toString()} id={`time-${time}`} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={`time-${time}`}
                                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-sky-500 peer-data-[state=checked]:bg-sky-500/10 cursor-pointer transition-all"
                                                    >
                                                        <span className="text-xl font-bold">{time}s</span>
                                                        <span className="text-xs text-neutral-400">{time === 0 ? '即时' : '准备'}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    {/* Voice Selection */}
                                    <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Volume2 className="w-5 h-5 text-emerald-400" />
                                            <Label className="text-lg font-semibold text-neutral-200">面试官声音</Label>
                                        </div>
                                        <div className="space-y-2">
                                            {VOICE_OPTIONS.map((voice) => (
                                                <div
                                                    key={voice.id}
                                                    onClick={() => setConfig({ ...config, voiceId: voice.id })}
                                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.voiceId === voice.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-700 hover:border-neutral-600'}`}
                                                >
                                                    <span className="text-sm font-medium">{voice.name}</span>
                                                    {config.voiceId === voice.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={() => setConfigStep('avatar')}
                                        className="bg-sky-600 hover:bg-sky-500 text-white rounded-full px-8 py-6 text-lg"
                                    >
                                        下一步 <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="avatar-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-white mb-2">面试官形象</h2>
                                    <p className="text-neutral-400">选择一位让您感到舒适的面试官</p>
                                </div>

                                {/* Avatar Selection */}
                                <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 space-y-4">
                                    <div className="flex justify-center">
                                        {AVATAR_OPTIONS.map((avatar) => (
                                            <div
                                                key={avatar.id}
                                                onClick={() => setConfig({ ...config, avatarId: avatar.id as any })}
                                                className={`relative w-56 h-56 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group ${config.avatarId === avatar.id ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-neutral-700 hover:border-neutral-500'}`}
                                            >
                                                <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-center text-sm font-medium text-white backdrop-blur-sm">
                                                    {avatar.name.split(' ')[0]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-center pt-8">
                                    <Button
                                        onClick={startRealInterview}
                                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-full text-lg shadow-lg hover:shadow-sky-500/25 transition-all w-full md:w-auto"
                                    >
                                        开始面试 <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // --- Render Live Interview Screen ---
    // (lastSummary is derived above)

    return (
        <div className="h-full flex flex-col relative animate-in slide-in-from-right duration-300">
            <div className="absolute top-4 left-0 z-20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        disconnect();
                        setStep('selection');
                    }}
                    className="text-neutral-400 hover:text-white"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t('modals.aiModal.interviewTab.exit')}
                </Button>
            </div>

            {/* Top Right Controls: Log Toggle */}
            <div className="absolute top-4 right-0 z-50 flex gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLogs(!showLogs)}
                    className={`transition-colors ${showLogs ? 'text-sky-400 bg-sky-950/30' : 'text-neutral-500 hover:text-white'}`}
                    title="Realtime Console"
                >
                    <Code2 size={20} />
                </Button>
            </div>

            {/* Log Terminal Overlay */}
            {showLogs && (
                <div className="absolute top-16 right-0 w-80 md:w-96 max-h-[60vh] bg-neutral-950/95 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden flex flex-col z-40 backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-200">
                    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-b border-neutral-800">
                        <span className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                            <Server size={12} /> Realtime Console
                        </span>
                        <div className="flex gap-1.5 opacity-60">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                        {logs.length === 0 && <div className="text-neutral-600 italic text-center py-4">Waiting for connection...</div>}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 leading-relaxed">
                                <span className="text-neutral-600 shrink-0 select-none">[{log.time}]</span>
                                <span className={`break-words ${log.message.includes('🔥') || log.message.includes('❌') ? 'text-red-400 font-bold' :
                                    log.message.includes('🤖') ? 'text-sky-300' :
                                        log.message.includes('👤') ? 'text-emerald-300' :
                                            log.message.includes('🎤') ? 'text-yellow-400' :
                                                log.message.includes('🚀') || log.message.includes('✅') ? 'text-green-400' :
                                                    'text-neutral-300'
                                    }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                    </div>
                </div>
            )}

            {/* Connecting Overlay */}
            {isConnecting && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
                    <p className="text-white text-lg font-medium animate-pulse">正在连接面试官...</p>
                    <p className="text-neutral-400 text-sm mt-2">正在阅读您的简历...</p>
                </div>
            )}

            {/* Main Stage: Avatar & Subtitles */}
            <div className="flex-1 w-full relative flex flex-col items-center justify-center overflow-hidden pb-16">
                <div className="relative z-10 transition-all duration-300 transform scale-90 md:scale-100">
                    <CartoonAvatar isSpeaking={isAiSpeaking} />
                </div>

                {/* Subtitles Area - Higher up */}
                <AnimatePresence mode="wait">
                    {displayItem && (
                        <motion.div
                            key={displayItem.role}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-40 left-0 right-0 px-4 flex justify-center pointer-events-none z-20"
                        >
                            <div className={`max-w-xl px-6 py-4 rounded-3xl backdrop-blur-md shadow-2xl border transition-colors duration-300 ${displayItem.role === 'ai'
                                ? 'bg-neutral-900/80 border-sky-500/30 text-sky-100 shadow-sky-900/20'
                                : 'bg-neutral-800/80 border-white/10 text-neutral-200'
                                }`}>
                                <div className="text-lg font-medium leading-relaxed text-center line-clamp-3">
                                    "{displayItem.text}"
                                    {displayItem.role === 'ai' && isAiSpeaking && (
                                        <span className="inline-block w-2 H-4 ml-1 bg-sky-400 animate-pulse">|</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Thinking Timer - Bottom Left */}
            <AnimatePresence>
                {timeLeft !== null && timeLeft > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute bottom-8 left-8 z-30 flex items-center gap-3 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-5 py-3 rounded-full shadow-lg"
                    >
                        <div className="relative">
                            <svg className="w-8 h-8 -rotate-90">
                                <circle cx="16" cy="16" r="14" fill="none" strokeWidth="3" className="stroke-neutral-800" />
                                <circle
                                    cx="16" cy="16" r="14" fill="none" strokeWidth="3"
                                    className="stroke-sky-500 transition-all duration-1000 ease-linear"
                                    strokeDasharray={88}
                                    strokeDashoffset={88 - (88 * timeLeft) / config.thinkingTime}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {timeLeft}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">思考时间</span>
                            <span className="text-xs text-neutral-400">点击麦克风提前回答</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voice Controls Footer - Absolute Bottom Center */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
                <div className="relative group">
                    {isListening && (
                        <>
                            <motion.div
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 bg-sky-500 rounded-full z-0"
                            />
                            <motion.div
                                initial={{ scale: 1, opacity: 0.3 }}
                                animate={{ scale: 1.3, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                                className="absolute inset-0 bg-sky-400 rounded-full z-0"
                            />
                        </>
                    )}
                    <Button
                        size="icon"
                        onClick={toggleListening}
                        className={`h-20 w-20 rounded-full relative z-10 transition-all duration-300 shadow-2xl border-[3px] flex items-center justify-center ${isListening
                            ? 'bg-red-500 hover:bg-red-600 border-red-400 scale-110'
                            : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-900'
                            }`}
                        title={isListening ? "停止录音" : "开始录音"}
                    >
                        {isListening ? <Square fill="currentColor" size={28} className="text-white" /> : <Mic size={32} />}
                    </Button>
                </div>
                <span className={`text-xs text-neutral-500 font-medium tracking-wide uppercase transition-opacity ${!isListening ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    点击说话
                </span>
            </div>

        </div >
    );
}
