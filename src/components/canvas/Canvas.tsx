'use client';
// NOTE: This component intentionally uses refs to mirror state for immediate rendering control.
// Refs are mutated directly; ensure any new logic preserves consistency between refs and state.
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Toolbar from './Toolbar';
import Branch from '../Branch';
import Leaf from '../Leaf';
import { createIdea, listIdeasForProject, updateIdea } from '../../services/firestore';

type ItemType = 'branch' | 'leaf';

interface Item {
    id: string;
    type: ItemType;
    x: number; // world coordinates
    y: number; // world coordinates
    label: string;
    content?: string;
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

interface CanvasProps {
    userId: string;
    projectId: string;
}

const Canvas: React.FC<CanvasProps> = ({ userId, projectId }) => {
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

    // Smoothly center the view and reset zoom
    const centerView = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const startScale = scaleRef.current;
        const startTx = txRef.current;
        const startTy = tyRef.current;
        const targetScale = 1;
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        const targetTx = cssWidth / 2;
        const targetTy = cssHeight / 2;
        smoothTransition(startScale, targetScale, (value) => {
            scaleRef.current = value;
            setScale(value);
        });
        smoothTransition(startTx, targetTx, (value) => {
            txRef.current = value;
            setTranslateX(value);
        });
        smoothTransition(startTy, targetTy, (value) => {
            tyRef.current = value;
            setTranslateY(value);
        });
    }, []);

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
        // Center the view on initial mount (animate via rAF callbacks)
        centerView();

        return () => {
            window.removeEventListener('resize', onResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [render, centerView]);

    // Load existing ideas as items on mount / when project changes
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!userId || !projectId) return;
            try {
                const ideas = await listIdeasForProject(userId, projectId);
                if (cancelled) return;
                setItems(
                    ideas.map((i) => ({
                        id: i.id,
                        type: 'leaf',
                        x: i.data.x ?? 0,
                        y: i.data.y ?? 0,
                        label: i.data.text,
                        content: i.data.addtlText,
                    }))
                );
            } catch (err) {
                console.error('Failed to load ideas for canvas', err);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [userId, projectId]);

    // schedule renders when transform/scale/items change
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => { render(); rafRef.current = null; });
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [scale, translateX, translateY, items, render]);

    // wheel zoom (zoom towards pointer)
    const handleWheel: React.WheelEventHandler<HTMLCanvasElement> = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomIntensity = 0.0015;
        const delta = -e.deltaY;

        const prevScale = scaleRef.current;
        const newScale = clamp(prevScale * (1 + delta * zoomIntensity), 0.2, 6);

        let newTx = mouseX - ((mouseX - txRef.current) / prevScale) * newScale;
        let newTy = mouseY - ((mouseY - tyRef.current) / prevScale) * newScale;

        const { tx: clampedTx, ty: clampedTy } = clampTranslation(newTx, newTy, newScale);
        newTx = clampedTx;
        newTy = clampedTy;

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

    // Create a new item and persist as an Idea with coordinates
    const addItem = useCallback(async (type: ItemType) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        const worldX = (cssWidth / 2 - txRef.current) / scaleRef.current;
        const worldY = (cssHeight / 2 - tyRef.current) / scaleRef.current;
        const defaultLabel = type === 'branch' ? 'New Branch' : 'New Question';
        try {
            const ideaId = await createIdea(userId, projectId, {
                text: defaultLabel,
                addtlText: '',
                x: worldX,
                y: worldY,
            });
            setItems((prev) => {
                const next = [
                    ...prev,
                    {
                        id: ideaId,
                        type,
                        x: worldX,
                        y: worldY,
                        label: defaultLabel,
                        content: '',
                    },
                ];
                itemsRef.current = next;
                return next;
            });
        } catch (err) {
            console.error('Failed to create idea for canvas item', err);
        }
    }, [userId, projectId]);

    // Main render
    return (
        <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
            {/* Top toolbar - always visible */}
            <div className="w-full flex-none z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b">
                <Toolbar addItem={addItem} onCenter={centerView}/>
            </div>
            {/* Canvas container - fills remaining space */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        touchAction: 'none',
                        opacity: isAtEdge ? 0.95 : 1,
                        transition: 'opacity 150ms ease-in-out',
                    }}
                    className="bg-background"
                />
                {/* Block container */}
                <div className="absolute inset-0 pointer-events-none">
                    {items.map((item) => {
                        const screenX = item.x * scale + translateX;
                        const screenY = item.y * scale + translateY;
                        const style: React.CSSProperties = {
                            position: 'absolute',
                            left: screenX,
                            top: screenY,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            transformOrigin: 'center center',
                            zIndex: 2,
                            pointerEvents: 'auto',
                        };
                        if (item.type === 'branch') {
                            return (
                                <Branch
                                    key={item.id}
                                    label={item.label}
                                    content={item.content}
                                    style={style}
                                    onChange={(newLabel, newContent) => {
                                        setItems(items.map(i =>
                                            i.id === item.id
                                                ? { ...i, label: newLabel, content: newContent }
                                                : i
                                        ));
                                        // Persist label/content changes for branches as well if desired
                                        updateIdea(userId, projectId, item.id, { text: newLabel, addtlText: newContent }).catch(() => {});
                                    }}
                                />
                            );
                        } else if (item.type === 'leaf') {
                            return (
                                <Leaf
                                    key={item.id}
                                    label={item.label}
                                    content={item.content}
                                    style={style}
                                    onChange={(newLabel, newContent) => {
                                        setItems(items.map(i =>
                                            i.id === item.id
                                                ? { ...i, label: newLabel, content: newContent }
                                                : i
                                        ));
                                        // Persist leaf edits to ideas CRUD
                                        updateIdea(userId, projectId, item.id, { text: newLabel, addtlText: newContent }).catch(() => {});
                                    }}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
                {/* Zoom indicator */}
                <div className="absolute bottom-4 left-4 z-10 bg-card p-2 rounded shadow text-sm">
                    Zoom: {(scale * 100).toFixed(0)}%
                </div>
            </div>
        </div>
    );
}

export default Canvas;