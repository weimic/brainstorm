'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Toolbar from './Toolbar';

type ItemType = 'rectangle' | 'circle';

interface Item {
    id: string;
    type: ItemType;
    x: number; // world coordinates
    y: number; // world coordinates
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// World bounds and padding (in world units)
const WORLD_BOUNDS = {
    minX: -5000,
    minY: -5000,
    maxX: 5000,
    maxY: 5000,
} as const;

const SCREEN_PADDING = 100; // px padding from bounds
const ANIMATION_DURATION = 500; // ms for smooth transitions

// Smooth transition helper with easing
const smoothTransition = (
    start: number,
    end: number,
    onUpdate: (value: number) => void,
    duration: number = ANIMATION_DURATION,
    easing: (t: number) => number = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
) => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        const current = start + (end - start) * easedProgress;
        onUpdate(current);
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);
};

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [scale, setScale] = useState<number>(1);
    const [translateX, setTranslateX] = useState<number>(0);
    const [translateY, setTranslateY] = useState<number>(0);
    const [items, setItems] = useState<Item[]>([]);
    const [isAtEdge, setIsAtEdge] = useState(false);
    const edgeTimeoutRef = useRef<number | null>(null);

    // refs for immediate responsiveness and to avoid stale closures in render
    const scaleRef = useRef(scale);
    const txRef = useRef(translateX);
    const tyRef = useRef(translateY);
    const itemsRef = useRef<Item[]>(items);

    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { txRef.current = translateX; }, [translateX]);
    useEffect(() => { tyRef.current = translateY; }, [translateY]);
    useEffect(() => { itemsRef.current = items; }, [items]);

    // Compute allowed translation range for current scale
    const clampTranslation = useCallback((tx: number, ty: number, currentScale: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { tx, ty };

        // screen dimensions in CSS pixels
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;

        // compute allowed ranges (with padding)
        const txMin = cssWidth - (WORLD_BOUNDS.maxX * currentScale) - SCREEN_PADDING;
        const txMax = -(WORLD_BOUNDS.minX * currentScale) + SCREEN_PADDING;
        const tyMin = cssHeight - (WORLD_BOUNDS.maxY * currentScale) - SCREEN_PADDING;
        const tyMax = -(WORLD_BOUNDS.minY * currentScale) + SCREEN_PADDING;

        // clamp and detect if we hit an edge
        const clampedTx = clamp(tx, txMin, txMax);
        const clampedTy = clamp(ty, tyMin, tyMax);
        const hitEdge = clampedTx !== tx || clampedTy !== ty;

        // show edge feedback briefly
        if (hitEdge) {
            setIsAtEdge(true);
            if (edgeTimeoutRef.current) window.clearTimeout(edgeTimeoutRef.current);
            edgeTimeoutRef.current = window.setTimeout(() => {
                setIsAtEdge(false);
                edgeTimeoutRef.current = null;
            }, 450) as unknown as number;
        }

        return { tx: clampedTx, ty: clampedTy };
    }, []);

    // RAF ref
    const rafRef = useRef<number | null>(null);

    // render function uses refs for latest values
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        // ensure context scale for high-DPI
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;

        ctx.clearRect(0, 0, cssWidth, cssHeight);

        ctx.save();
        ctx.translate(txRef.current, tyRef.current);
        ctx.scale(scaleRef.current, scaleRef.current);

        // Grid
        const gridSize = 50;
        ctx.lineWidth = 1 / Math.max(1, scaleRef.current);
        ctx.strokeStyle = 'rgba(128,128,128,0.12)';

        const viewLeft = (-txRef.current) / scaleRef.current;
        const viewTop = (-tyRef.current) / scaleRef.current;
        const viewRight = (cssWidth - txRef.current) / scaleRef.current;
        const viewBottom = (cssHeight - tyRef.current) / scaleRef.current;

        const startX = Math.floor(viewLeft / gridSize) * gridSize;
        const startY = Math.floor(viewTop / gridSize) * gridSize;

        for (let x = startX; x <= viewRight; x += gridSize) {
            for (let y = startY; y <= viewBottom; y += gridSize) {
                ctx.strokeRect(x, y, gridSize, gridSize);
            }
        }

        // item colors from CSS variables (fallbacks provided)
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary')?.trim() || '#2563EB';
        const destructiveColor = rootStyles.getPropertyValue('--destructive')?.trim() || '#DC2626';

        itemsRef.current.forEach((item) => {
            if (item.type === 'rectangle') {
                ctx.fillStyle = primaryColor;
                ctx.fillRect(item.x - 50, item.y - 25, 100, 50);
                ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                ctx.strokeRect(item.x - 50, item.y - 25, 100, 50);
            } else if (item.type === 'circle') {
                ctx.fillStyle = destructiveColor;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 40, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }, []);

    // setup: size canvas to viewport and schedule an initial render
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;

        const resize = () => {
            const cssWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            const cssHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            canvas.style.width = cssWidth + 'px';
            canvas.style.height = cssHeight + 'px';
            canvas.width = Math.floor(cssWidth * dpr);
            canvas.height = Math.floor(cssHeight * dpr);
            // schedule render
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => { render(); rafRef.current = null; });
        };

        const onResize = () => resize();
        window.addEventListener('resize', onResize);
        // initial
        resize();

        return () => {
            window.removeEventListener('resize', onResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [render]);

    // schedule renders when transform/scale/items change
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => { render(); rafRef.current = null; });
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [scale, translateX, translateY, items, render]);

    // wheel zoom (zoom towards pointer) - update refs immediately for responsive feedback
    const handleWheel: React.WheelEventHandler<HTMLCanvasElement> = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomIntensity = 0.0015; // finer control
        const delta = -e.deltaY; // invert so wheel up zooms in (typical)


        const prevScale = scaleRef.current;
        const newScale = clamp(prevScale * (1 + delta * zoomIntensity), 0.2, 6);

        // Correct math to keep the world point under the cursor fixed:
        // world = (screen - tx) / scale
        // newTx must satisfy: mouseX = world * newScale + newTx
        // => newTx = mouseX - world * newScale = mouseX - ((mouseX - tx)/prevScale) * newScale
        let newTx = mouseX - ((mouseX - txRef.current) / prevScale) * newScale;
        let newTy = mouseY - ((mouseY - tyRef.current) / prevScale) * newScale;

        // clamp to world bounds
        const { tx: clampedTx, ty: clampedTy } = clampTranslation(newTx, newTy, newScale);
        newTx = clampedTx;
        newTy = clampedTy;

        // sync refs and state
        scaleRef.current = newScale;
        txRef.current = newTx;
        tyRef.current = newTy;
        setScale(newScale);
        setTranslateX(newTx);
        setTranslateY(newTy);
    };

    // pointer events for panning
    const isPanningRef = useRef(false);
    const startRef = useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        isPanningRef.current = true;
        startRef.current = { x: e.clientX - txRef.current, y: e.clientY - tyRef.current };
    };

    const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
        if (!isPanningRef.current || !startRef.current) return;
        let newTx = e.clientX - startRef.current.x;
        let newTy = e.clientY - startRef.current.y;

        // clamp to world bounds
        const { tx: clampedTx, ty: clampedTy } = clampTranslation(newTx, newTy, scaleRef.current);
        newTx = clampedTx;
        newTy = clampedTy;

        txRef.current = newTx;
        tyRef.current = newTy;
        setTranslateX(newTx);
        setTranslateY(newTy);
    };

    const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
        try { (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {};
        isPanningRef.current = false;
        startRef.current = null;
    };

    // Smoothly center the view and reset zoom
    const centerView = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Start transitions from current values
        const startScale = scaleRef.current;
        const startTx = txRef.current;
        const startTy = tyRef.current;

        // Target scale is 1 (100%)
        const targetScale = 1;

        // Target translation is centered (0,0)
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        const targetTx = cssWidth / 2;
        const targetTy = cssHeight / 2;

        // Animate scale
        smoothTransition(startScale, targetScale, (value) => {
            scaleRef.current = value;
            setScale(value);
        });

        // Animate translations
        smoothTransition(startTx, targetTx, (value) => {
            txRef.current = value;
            setTranslateX(value);
        });
        
        smoothTransition(startTy, targetTy, (value) => {
            tyRef.current = value;
            setTranslateY(value);
        });
    }, []);

    // add item in the center of the visible canvas
    const addItem = useCallback((type: ItemType) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        const worldX = (cssWidth / 2 - txRef.current) / scaleRef.current;
        const worldY = (cssHeight / 2 - tyRef.current) / scaleRef.current;
        const newItem: Item = {
            id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
            type,
            x: worldX,
            y: worldY,
        };
        setItems((prev) => {
            const next = [...prev, newItem];
            itemsRef.current = next;
            return next;
        });
    }, []);

    return (
        <div className="h-full w-full relative">
            <Toolbar addItem={addItem} onCenter={centerView}/>
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    touchAction: 'none',
                    opacity: isAtEdge ? 0.95 : 1,
                    transition: 'opacity 150ms ease-in-out',
                }}
            />

            <div className="text-center fixed bottom-4 left-4 z-10 bg-card p-2 rounded shadow">
                Zoom: {(scale * 100).toFixed(0)}%
            </div>
        </div>
    );
};

export default Canvas;