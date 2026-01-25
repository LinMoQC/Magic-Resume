"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Extend window interface for PIXI
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PIXI: any;
    }
}

interface Live2DAvatarProps {
    isSpeaking: boolean;
    className?: string;
}

const Live2DAvatar = ({ isSpeaking, className = "" }: Live2DAvatarProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appRef = useRef<any>(null);
    const [scriptsLoaded, setScriptsLoaded] = useState({ live2d: false, cubism: false });
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    // Load PIXI and Model
    useEffect(() => {
        // Only initialize if scripts are loaded
        if (!scriptsLoaded.live2d || !scriptsLoaded.cubism) return;
        if (appRef.current) return; // Already initialized

        const initPixi = async () => {
            try {
                // Dynamic imports
                const PIXI = await import('pixi.js');
                const { Live2DModel } = await import('pixi-live2d-display');

                console.log("Initializing PIXI for Live2D...");

                // Expose PIXI globally for the plugin
                window.PIXI = PIXI;
                Live2DModel.registerTicker(PIXI.Ticker);

                const canvas = canvasRef.current;
                if (!canvas) return;

                // Create Application
                // Use type assertion or any because version 6/7/8 mismatch in types might occur
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const app = new PIXI.Application({
                    view: canvas,
                    width: 500,
                    height: 500,
                    autoDensity: true,
                    antialias: true,
                    backgroundAlpha: 0, // Transparent background
                    resolution: window.devicePixelRatio || 1,
                });

                appRef.current = app;

                // Load Model
                // We assume the model files are in /shizuku_model/ inside public folder
                const modelUrl = "/shizuku_model/shizuku.model.json";

                console.log("Loading model from:", modelUrl);
                const model = await Live2DModel.from(modelUrl);

                // Disable auto interaction to prevent mouse following if desired, 
                // or keep it for liveness. 
                // The original code set: model.autoInteract = false;
                model.autoInteract = false;

                // Scaling and Positioning
                // Original: scale 0.5, pos 30, -30 for 700x700 canvas
                // Here we have 500x500 canvas.
                model.scale.set(0.25);
                model.x = 100;
                model.y = 20;

                // Add to stage
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                app.stage.addChild(model as any);
                modelRef.current = model;
                setIsModelLoaded(true);

                console.log("Model loaded successfully");

            } catch (error) {
                console.error("Failed to initialize Live2D:", error);
            }
        };

        initPixi();

        return () => {
            // Cleanup
            if (appRef.current) {
                console.log("Cleaning up PIXI");
                appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                appRef.current = null;
            }
        };
    }, [scriptsLoaded.live2d, scriptsLoaded.cubism]);

    // Handle Mouth Movement
    useEffect(() => {
        if (!modelRef.current) return;

        // If speaking, open mouth. If not, close it.
        // For more realistic animation, we might want to modulate this val over time
        // But boolean check is a good start.

        // Digital-human-live2d logic:
        // modelRef.current.internalModel.coreModel.setParamFloat("PARAM_MOUTH_OPEN_Y", mouthOpen);

        // We can simulate talking by validating isSpeaking
        // A simple sine wave or random movement loop would be better if isSpeaking is true.

        let animationFrameId: number;

        const animateMouth = () => {
            if (isSpeaking && modelRef.current) {
                // Oscillate mouth open Y between 0 and 1
                // const time = Date.now() / 100;
                // const val = (Math.sin(time) + 1) / 2; // 0 to 1
                // Make it snappy
                const openAmount = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 random

                try {
                    // Check which core model is used (Cubism 2 vs 4)
                    // Shizuku is Cubism 2 usually (PARAM_MOUTH_OPEN_Y)
                    // But let's check internalModel type or just try/catch
                    modelRef.current.internalModel.coreModel.setParamFloat("PARAM_MOUTH_OPEN_Y", openAmount);
                } catch {
                    // Fallback for Cubism 4? (ParamMouthOpenY)
                }

                animationFrameId = requestAnimationFrame(animateMouth);
            } else if (modelRef.current) {
                // Reset to closed
                try {
                    modelRef.current.internalModel.coreModel.setParamFloat("PARAM_MOUTH_OPEN_Y", 0);
                } catch { }
            }
        };

        if (isSpeaking) {
            animateMouth();
        } else {
            // Close mouth immediately
            if (modelRef.current) {
                try {
                    modelRef.current.internalModel.coreModel.setParamFloat("PARAM_MOUTH_OPEN_Y", 0);
                } catch { }
            }
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

    }, [isSpeaking, isModelLoaded]);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <Script
                src="/library/live2d.min.js"
                onLoad={() => setScriptsLoaded(prev => ({ ...prev, live2d: true }))}
            />
            <Script
                src="/library/live2dcubismcore.js"
                onLoad={() => setScriptsLoaded(prev => ({ ...prev, cubism: true }))}
            />

            {!isModelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-xs">
                    Loading Avatar...
                </div>
            )}

            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
};

export default Live2DAvatar;
