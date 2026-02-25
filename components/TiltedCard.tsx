"use client";

import { MouseEvent, ReactNode, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./TiltedCard.module.css";

type TiltedCardProps = {
  imageSrc: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showTooltip?: boolean;
  overlayContent?: ReactNode;
  displayOverlayContent?: boolean;
};

const springValues = {
  damping: 18,
  stiffness: 260,
  mass: 0.65,
};

export default function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "100%",
  containerWidth = "100%",
  imageHeight = "100%",
  imageWidth = "100%",
  scaleOnHover = 1.05,
  rotateAmplitude = 12,
  showTooltip = false,
  overlayContent = null,
  displayOverlayContent = false,
}: TiltedCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateCaption = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });
  const [lastY, setLastY] = useState(0);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);

    const velocityY = offsetY - lastY;
    rotateCaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  };

  const handleMouseEnter = () => {
    scale.set(scaleOnHover);
    opacity.set(1);
  };

  const handleMouseLeave = () => {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateCaption.set(0);
  };

  return (
    <figure
      ref={ref}
      className={styles.figure}
      style={{ height: containerHeight, width: containerWidth }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div className={styles.inner} style={{ width: imageWidth, height: imageHeight, rotateX, rotateY, scale }}>
        <motion.img src={imageSrc} alt={altText} className={styles.img} style={{ width: imageWidth, height: imageHeight }} />
        {displayOverlayContent && overlayContent ? <motion.div className={styles.overlay}>{overlayContent}</motion.div> : null}
      </motion.div>

      {showTooltip ? (
        <motion.figcaption className={styles.caption} style={{ x, y, opacity, rotate: rotateCaption }}>
          {captionText}
        </motion.figcaption>
      ) : null}
    </figure>
  );
}
