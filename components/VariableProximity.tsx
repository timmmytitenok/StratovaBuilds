"use client";

import { forwardRef, HTMLAttributes, RefObject, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./VariableProximity.module.css";

type FalloffMode = "linear" | "exponential" | "gaussian";

type VariableProximityProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef?: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: FalloffMode;
  disabled?: boolean;
  enableProximityLift?: boolean;
  maxLiftPx?: number;
  maxScaleBoost?: number;
  glowColor?: string;
  glowBlurPx?: number;
};

function useAnimationFrame(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let frameId = 0;
    const loop = () => {
      callbackRef.current();
      frameId = window.requestAnimationFrame(loop);
    };
    frameId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frameId);
  }, []);
}

function useMousePositionRef(containerRef?: RefObject<HTMLElement | null>) {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (x: number, y: number) => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = { x: x - rect.left, y: y - rect.top };
        return;
      }
      positionRef.current = { x, y };
    };

    const handleMouseMove = (event: MouseEvent) => updatePosition(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
}

function parseVariationSettings(settings: string) {
  return new Map(
    settings
      .split(",")
      .map((token) => token.trim())
      .map((token) => {
        const [axisName, value] = token.split(" ");
        return [axisName.replace(/['"]/g, ""), Number.parseFloat(value)];
      }),
  );
}

function calculateDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function interpolateFalloff(distance: number, radius: number, falloff: FalloffMode) {
  const normalized = Math.min(Math.max(1 - distance / radius, 0), 1);
  if (falloff === "exponential") return normalized ** 2;
  if (falloff === "gaussian") return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
  return normalized;
}

const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>(function VariableProximity(
  {
    label,
    fromFontVariationSettings,
    toFontVariationSettings,
    containerRef,
    radius = 160,
    falloff = "linear",
    className,
    style,
    disabled = false,
    enableProximityLift = false,
    maxLiftPx = 10,
    maxScaleBoost = 0.08,
    glowColor = "rgba(139,92,246,0.45)",
    glowBlurPx = 20,
    ...restProps
  },
  ref,
) {
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const interpolatedSettingsRef = useRef<string[]>([]);
  const mousePositionRef = useMousePositionRef(containerRef);
  const lastPositionRef = useRef({ x: Number.NaN, y: Number.NaN });

  const parsedSettings = useMemo(() => {
    const fromSettings = parseVariationSettings(fromFontVariationSettings);
    const toSettings = parseVariationSettings(toFontVariationSettings);
    return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue,
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  useEffect(() => {
    const applyLockedCharacterWidths = () => {
      letterRefs.current.forEach((letterRef) => {
        if (!letterRef) return;
        letterRef.style.fontVariationSettings = fromFontVariationSettings;
        letterRef.style.width = "auto";
      });

      letterRefs.current.forEach((letterRef) => {
        if (!letterRef) return;
        const width = letterRef.getBoundingClientRect().width;
        letterRef.style.width = `${width}px`;
        letterRef.style.textAlign = "center";
      });
    };

    applyLockedCharacterWidths();
    window.addEventListener("resize", applyLockedCharacterWidths);
    return () => window.removeEventListener("resize", applyLockedCharacterWidths);
  }, [label, fromFontVariationSettings]);

  useAnimationFrame(() => {
    if (disabled || !containerRef?.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const { x, y } = mousePositionRef.current;
    if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) return;
    lastPositionRef.current = { x, y };

    letterRefs.current.forEach((letterRef, index) => {
      if (!letterRef) return;

      const rect = letterRef.getBoundingClientRect();
      const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
      const letterCenterY = rect.top + rect.height / 2 - containerRect.top;
      const distance = calculateDistance(x, y, letterCenterX, letterCenterY);

      if (distance >= radius) {
        letterRef.style.fontVariationSettings = fromFontVariationSettings;
        if (enableProximityLift) {
          letterRef.style.transform = "translate3d(0,0,0) scale(1)";
          letterRef.style.filter = "none";
          letterRef.style.zIndex = "0";
        }
        return;
      }

      const falloffValue = interpolateFalloff(distance, radius, falloff);
      const newSettings = parsedSettings
        .map(({ axis, fromValue, toValue }) => `'${axis}' ${fromValue + (toValue - fromValue) * falloffValue}`)
        .join(", ");

      interpolatedSettingsRef.current[index] = newSettings;
      letterRef.style.fontVariationSettings = newSettings;

      if (enableProximityLift) {
        const lift = maxLiftPx * falloffValue;
        const scale = 1 + maxScaleBoost * falloffValue;
        letterRef.style.transform = `translate3d(0, ${-lift}px, 0) scale(${scale})`;
        letterRef.style.filter = `drop-shadow(0 0 ${Math.max(2, glowBlurPx * falloffValue)}px ${glowColor})`;
        letterRef.style.zIndex = falloffValue > 0.1 ? "1" : "0";
      }
    });
  });

  const letters = Array.from(label);

  return (
    <span
      ref={ref}
      className={[styles.variableProximity, className].filter(Boolean).join(" ")}
      style={{ display: "inline", ...style }}
      {...restProps}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          ref={(el) => {
            letterRefs.current[index] = el;
          }}
          style={{
            display: "inline-block",
            position: "relative",
            whiteSpace: letter === " " ? "pre" : "normal",
            fontVariationSettings: fromFontVariationSettings,
            transform: "translate3d(0,0,0) scale(1)",
            transformOrigin: "50% 60%",
            transition: "transform 120ms ease-out, filter 140ms ease-out",
          }}
          aria-hidden="true"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
});

export default VariableProximity;
