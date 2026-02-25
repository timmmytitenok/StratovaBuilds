"use client";

import { FormEvent, HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Roboto_Flex } from "next/font/google";
import Image from "next/image";
import {
  ArrowRight,
  ChartColumn,
  CheckCircle2,
  ChevronDown,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import TiltedCard from "@/components/TiltedCard";
import VariableProximity from "@/components/VariableProximity";

type BillingMode = "monthly" | "one-time";

type FormValues = {
  fullName: string;
  phoneNumber: string;
  email: string;
  storeUrl: string;
  revenueStream: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const navItems = [
  { label: "Results", targetId: "outcomes" },
  { label: "Process", targetId: "process" },
  { label: "Pricing", targetId: "pricing" },
  { label: "Proof", targetId: "testimonials" },
];

const trustPills = [
  { label: "Built for Shopify", icon: ShieldCheck },
  { label: "Fast", icon: Zap },
  { label: "Mobile-first", icon: Rocket },
  { label: "Conversion-focused", icon: ChartColumn },
];

const beforeBulletPoints = [
  "Template layout customers have seen a thousand times",
  "Brand feels interchangeable",
  "Trust is harder to earn",
  "Conversion friction everywhere",
  "No intentional journey from product -> checkout",
];

const afterBulletPoints = [
  "Brand-first layout built around your product story",
  "Faster, cleaner, more premium feel",
  "Higher trust at first glance",
  "Fewer clicks to purchase",
  "Designed to increase AOV + conversion",
];

const initialFormValues: FormValues = {
  fullName: "",
  phoneNumber: "",
  email: "",
  storeUrl: "",
  revenueStream: "",
  message: "",
};

const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  weight: ["100", "400", "700", "1000"],
});

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatPhoneNumber(value: string) {
  const digits = getPhoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidStoreUrl(value: string) {
  return /^https?:\/\/.+/i.test(value.trim());
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required.";
  } else if (getPhoneDigits(values.phoneNumber).length !== 10) {
    errors.phoneNumber = "Enter a valid 10-digit phone number.";
  }
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Please enter a valid email.";
  }
  if (values.storeUrl.trim() && !isValidStoreUrl(values.storeUrl)) {
    errors.storeUrl = "Use a full URL, including https://";
  }
  if (!values.revenueStream) errors.revenueStream = "Select your revenue stream.";
  return errors;
}

function ScrollLink({
  targetId,
  children,
  className,
  onClick,
}: {
  targetId: string;
  children: ReactNode;
  className?: string;
  onClick: (targetId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(targetId)}
      className={cn(
        "group relative -mx-0.5 rounded-xl px-4 py-2 text-sm text-zinc-200 transition duration-200 hover:-translate-y-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl bg-violet-400/0 shadow-[0_0_0_rgba(139,92,246,0)] transition duration-200 group-hover:bg-violet-400/[0.08] group-hover:shadow-[0_0_24px_rgba(139,92,246,0.28)]"
      />
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 -bottom-[1px] h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-violet-300/90 to-transparent transition-transform duration-200 group-hover:scale-x-100"
      />
    </button>
  );
}

function SectionReveal({
  children,
  className,
  delay = 0,
  reduced = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  reduced?: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0.2, y: 18, filter: "blur(18px)" }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.48, ease: "easeOut", delay }}
      style={reduced ? undefined : { willChange: "opacity, transform, filter" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function LeadForm({
  title,
  subtitle,
  onClose,
  compact = false,
}: {
  title: string;
  subtitle: string;
  onClose?: () => void;
  compact?: boolean;
}) {
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isFormReady =
    values.fullName.trim().length > 0 &&
    getPhoneDigits(values.phoneNumber).length === 10 &&
    isValidEmail(values.email) &&
    (!values.storeUrl.trim() || isValidStoreUrl(values.storeUrl)) &&
    values.revenueStream.trim().length > 0;

  const handleChange = (key: keyof FormValues, value: string) => {
    const nextValue = key === "phoneNumber" ? formatPhoneNumber(value) : value;
    setValues((prev) => ({ ...prev, [key]: nextValue }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Request failed");
      }
      setSubmitted(true);
      setValues(initialFormValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again in a moment.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-violet-400/35 bg-zinc-950/80 p-6 text-center shadow-[0_0_40px_rgba(139,92,246,0.22)]"
      >
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-violet-300" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-white">Thanks for submitting!</h3>
        <p className="mt-2 text-sm text-zinc-300">
          Our team will reach out within 24 hours to schedule a call with you. Cannot wait!
        </p>
        {onClose ? (
          <button
            type="button"
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-violet-400/60 hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            onClick={onClose}
            aria-label="Finish and close"
          >
            Finished
          </button>
        ) : null}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", compact ? "" : "mt-5")}>
      <div>
        <h3 className="text-xl font-semibold tracking-wide text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-300">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          value={values.fullName}
          onChange={(v) => handleChange("fullName", v)}
          error={errors.fullName}
          autoComplete="name"
        />
        <Field
          label="Phone number"
          value={values.phoneNumber}
          onChange={(v) => handleChange("phoneNumber", v)}
          error={errors.phoneNumber}
          autoComplete="tel"
          inputMode="numeric"
          onKeyDown={(event) => {
            const allowedKeys = [
              "Backspace",
              "Delete",
              "ArrowLeft",
              "ArrowRight",
              "Tab",
              "Home",
              "End",
            ];
            if (event.ctrlKey || event.metaKey || event.altKey || allowedKeys.includes(event.key)) return;
            if (!/^\d$/.test(event.key)) {
              event.preventDefault();
              return;
            }
            if (getPhoneDigits(values.phoneNumber).length >= 10) {
              event.preventDefault();
            }
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Email"
            value={values.email}
            onChange={(v) => handleChange("email", v)}
            error={errors.email}
            inputMode="email"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Store URL"
          placeholder="https://yourstore.com"
          value={values.storeUrl}
          onChange={(v) => handleChange("storeUrl", v)}
          error={errors.storeUrl}
          autoComplete="url"
        />
        <div>
          <label className="mb-1.5 block text-sm text-zinc-200" htmlFor="revenueStream">
            Revenue stream
          </label>
          <select
            id="revenueStream"
            value={values.revenueStream}
            onChange={(e) => handleChange("revenueStream", e.target.value)}
            className={cn(
              "w-full rounded-xl border bg-zinc-950 px-3 py-2 text-base text-white transition focus-visible:outline-none focus-visible:ring-2 sm:text-sm",
              errors.revenueStream
                ? "border-rose-400/80 focus-visible:ring-rose-400"
                : "border-white/15 focus-visible:ring-violet-400",
            )}
          >
            <option value="">Select...</option>
            <option value="$0 - $10k/mo">$0 - $10k/mo</option>
            <option value="$10k - $50k/mo">$10k - $50k/mo</option>
            <option value="$50k - $250k/mo">$50k - $250k/mo</option>
            <option value="$250k+/mo">$250k+/mo</option>
          </select>
          {errors.revenueStream ? <p className="mt-1 text-xs text-rose-300">{errors.revenueStream}</p> : null}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-zinc-200" htmlFor="message">
          Message (optional)
        </label>
        <textarea
          id="message"
          value={values.message}
          onChange={(e) => handleChange("message", e.target.value)}
          rows={compact ? 4 : 5}
          placeholder="Tell us what you want to improve first."
          className={cn(
            "w-full rounded-xl border bg-zinc-950 px-3 py-2 text-base text-white transition focus-visible:outline-none focus-visible:ring-2 sm:text-sm",
            errors.message ? "border-rose-400/80 focus-visible:ring-rose-400" : "border-white/15 focus-visible:ring-violet-400",
          )}
        />
        {errors.message ? <p className="mt-1 text-xs text-rose-300">{errors.message}</p> : null}
      </div>
      {submitError ? <p className="text-sm text-rose-300">{submitError}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting || !isFormReady}
        className="inline-flex w-full items-center justify-center rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] transition hover:-translate-y-0.5 hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Submitting..." : "Book a Call"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
  autoComplete,
  onKeyDown,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-200" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full rounded-xl border bg-zinc-950 px-3 py-2 text-base text-white transition placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 sm:text-sm",
          error ? "border-rose-400/80 focus-visible:ring-rose-400" : "border-white/15 focus-visible:ring-violet-400",
        )}
      />
      {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

export default function Home() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const reduceMotion = useReducedMotion();
  const titleProximityRef = useRef<HTMLDivElement>(null);
  const paragraphProximityRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const pricingHeaderStagger = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" as const } },
      };
  const sectionStagger = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0.2, filter: "blur(14px)" },
        show: {
          opacity: 1,
          filter: "blur(0px)",
          transition: { staggerChildren: 0.12 },
        },
      };
  const sectionItem = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0.15, y: 20, filter: "blur(10px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: "easeOut" as const } },
      };

  useEffect(() => {
    if (!isFormModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFormModalOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFormModalOpen]);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const delta = currentScrollY - previousScrollY;

      if (currentScrollY < 12) {
        setIsHeaderVisible(true);
      } else if (delta > 2) {
        setIsHeaderVisible(false);
      } else if (delta < -2) {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateViewportMode = () => setIsMobileViewport(media.matches);
    updateViewportMode();
    media.addEventListener("change", updateViewportMode);
    return () => media.removeEventListener("change", updateViewportMode);
  }, []);

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07070b] text-zinc-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.2] mix-blend-screen"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: isMobileViewport ? "46px 46px" : "84px 84px",
          }}
        />
        <motion.div
          className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-white/15 blur-[130px]"
          animate={reduceMotion ? undefined : { opacity: [0.25, 0.42, 0.3], y: [0, 12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-[-9rem] h-72 w-72 rounded-full bg-violet-500/20 blur-[120px]"
          animate={reduceMotion ? undefined : { opacity: [0.18, 0.3, 0.2], x: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.header
        initial={false}
        animate={isHeaderVisible ? { y: 0, opacity: 1 } : { y: -96, opacity: 0.9 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b border-white/10 bg-[#07070b]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:py-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
            className="inline-flex items-center gap-2 text-base font-semibold tracking-[0.12em] text-white sm:text-lg sm:tracking-[0.14em]"
          >
            <Image src="/stratova-logo.png" alt="Stratova logo" width={24} height={24} className="h-6 w-6 rounded-sm" priority />
            <span>STRATOVA</span>
          </button>
          <nav aria-label="Main navigation" className="hidden items-center gap-3 md:flex">
            {navItems.map((item) => (
              <ScrollLink key={item.targetId} targetId={item.targetId} onClick={scrollToSection}>
                {item.label}
              </ScrollLink>
            ))}
          </nav>
          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] transition hover:-translate-y-0.5 hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              Book a Call <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-8">
        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0.2, y: 18, filter: "blur(18px)" }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={reduceMotion ? undefined : { willChange: "opacity, transform, filter" }}
          className="relative flex min-h-[96svh] flex-col items-center justify-start py-8 text-center md:min-h-[calc(100svh-5.5rem)] md:justify-center md:py-14"
        >
          <motion.div
            className="pointer-events-none absolute -right-6 top-6 h-36 w-36 rounded-full bg-violet-500/25 blur-3xl"
            animate={reduceMotion ? undefined : { y: [0, -10, 0], opacity: [0.18, 0.4, 0.22] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-zinc-400 sm:text-xs sm:tracking-[0.28em] md:top-6"
          >
            <span className="md:hidden">Shopify web development</span>
            <span className="hidden md:inline">Shopify web development + AI automations</span>
          </motion.p>
          <div className="mt-12 flex flex-col items-center md:mt-20">
            <motion.h1
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="flex flex-wrap items-center justify-center gap-1 text-[3.15rem] font-black uppercase tracking-[0.08em] text-white sm:text-7xl md:text-[9.25rem] md:leading-[0.9]"
              aria-label="Stratova"
            >
              <div ref={titleProximityRef} className="relative">
                <span
                  className={`${robotoFlex.className} block select-none text-[3.6rem] text-white md:hidden`}
                  style={{
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.95), 0 2px 0 rgba(255,255,255,0.9), 0 8px 0 rgba(54,54,72,0.85), 0 18px 34px rgba(0,0,0,0.65)",
                  }}
                >
                  STRATOVA
                </span>
                <span className="hidden md:inline-block">
                  <VariableProximity
                    label="STRATOVA"
                    className={`${robotoFlex.className} cursor-default select-none bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent`}
                    style={{
                      textShadow:
                        "0 1px 0 rgba(255,255,255,0.72), 0 2px 0 rgba(225,225,235,0.48), 0 8px 0 rgba(54,54,72,0.82), 0 18px 34px rgba(0,0,0,0.66)",
                    }}
                    fromFontVariationSettings="'wght' 760, 'opsz' 42"
                    toFontVariationSettings="'wght' 1000, 'opsz' 110"
                    containerRef={titleProximityRef}
                    radius={240}
                    falloff="gaussian"
                    enableProximityLift
                    maxLiftPx={14}
                    maxScaleBoost={0.14}
                    glowColor="rgba(255,255,255,0.2)"
                    glowBlurPx={22}
                    disabled={Boolean(reduceMotion)}
                  />
                </span>
              </div>
            </motion.h1>
            <motion.h2
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="mt-1 text-lg font-extralight uppercase tracking-[0.48em] text-zinc-200 sm:text-xl md:mt-6 md:text-3xl md:tracking-[0.7em]"
            >
              Builds
            </motion.h2>
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="mx-auto mt-14 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:mt-16 sm:text-lg md:mt-12 md:text-xl"
            >
              <div ref={paragraphProximityRef} className="relative">
                <VariableProximity
                  label="Most stores look the same. Stratova builds custom storefronts that feel premium - plus automations that recover revenue while you sleep."
                  className={`${robotoFlex.className} text-zinc-300`}
                  fromFontVariationSettings="'wght' 360, 'opsz' 10"
                  toFontVariationSettings="'wght' 950, 'opsz' 42"
                  containerRef={paragraphProximityRef}
                  radius={190}
                  falloff="gaussian"
                  disabled={Boolean(reduceMotion) || isMobileViewport}
                />
              </div>
            </motion.div>
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="mt-16 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center md:mt-14"
            >
              <motion.button
                type="button"
                onClick={() => setIsFormModalOpen(true)}
                whileHover={
                  reduceMotion
                    ? undefined
                    : { y: -4, scale: 1.02, boxShadow: "0px 14px 40px rgba(139,92,246,0.5), 0px 0px 28px rgba(139,92,246,0.35)" }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.94, y: 0, boxShadow: "0px 4px 14px rgba(139,92,246,0.35)" }}
                transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-8 py-4 text-lg font-semibold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:w-auto sm:px-7 sm:text-base md:px-8 md:py-[1.125rem] md:text-lg"
                style={{ willChange: "transform, box-shadow" }}
              >
                Book a Call <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </motion.button>
              <motion.a
                href="#pricing"
                whileHover={
                  reduceMotion
                    ? undefined
                    : { y: -4, scale: 1.02, borderColor: "rgba(139,92,246,0.7)", boxShadow: "0px 14px 36px rgba(139,92,246,0.22)" }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.95, y: 0, boxShadow: "0px 4px 10px rgba(139,92,246,0.18)" }}
                transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 py-4 text-lg font-semibold text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:w-auto sm:px-7 sm:text-base md:px-8 md:py-[1.125rem] md:text-lg"
                style={{ willChange: "transform, box-shadow, border-color" }}
              >
                See Pricing <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </motion.a>
            </motion.div>
            <div className="mt-12 flex flex-wrap justify-center gap-2.5 md:mt-8">
              {trustPills.map((pill, index) => (
                <motion.div
                  key={pill.label}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 + index * 0.08 }}
                  className={cn(
                    "items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300",
                    pill.label === "Fast" || pill.label === "Mobile-first" ? "hidden md:flex" : "flex",
                  )}
                >
                  <pill.icon className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
                  <span>{pill.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section id="before-after" className="relative mt-32 scroll-mt-28 pt-6 pb-16 md:mt-20 md:py-28">
          <motion.div
            variants={sectionStagger}
            initial={reduceMotion ? undefined : "hidden"}
            whileInView={reduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.15 }}
            className="space-y-8"
          >
            <motion.p variants={sectionItem} className="text-center text-xs uppercase tracking-[0.2em] text-violet-300">
              BEFORE vs AFTER
            </motion.p>
            <motion.h2
              variants={sectionItem}
              className="mx-auto max-w-6xl text-center text-4xl font-semibold tracking-[0.03em] text-white md:whitespace-nowrap md:text-5xl"
            >
              <span className="md:hidden">
                <span className="block">Spot a theme</span>
                <span className="block">store instantly.</span>
              </span>
              <span className="hidden md:inline">You can spot a theme store instantly.</span>
            </motion.h2>
            <motion.p
              variants={sectionItem}
              className="mx-auto max-w-6xl text-center text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap md:text-lg"
            >
              Customers see it too. Custom isn&apos;t about design-it&apos;s about perception that lifts conversion.
            </motion.p>

            <motion.div
              initial={reduceMotion ? undefined : { y: 14, filter: "blur(16px)" }}
              whileInView={reduceMotion ? undefined : { y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.14 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="grid gap-x-10 gap-y-14 pt-6 md:gap-y-10 lg:grid-cols-2"
            >
              <div className="space-y-5">
                <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-zinc-200">
                  BEFORE
                </span>
                <motion.div
                  initial={reduceMotion ? undefined : { opacity: 0.2, filter: "blur(16px)" }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.38, ease: "easeOut" }}
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.03]"
          >
            <Image
                    src="/before-store-reference-v2.png"
                    alt="Before example storefront reference"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </motion.div>
                <p className="text-lg font-medium text-zinc-100">Looks fine. Converts average.</p>
                <ul className="space-y-2.5 text-sm leading-relaxed text-zinc-300">
                  {beforeBulletPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.div className="space-y-5" transition={{ duration: 0.18, ease: "easeOut" }}>
                <span className="inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-violet-200">
                  AFTER
                </span>
                <motion.div
                  initial={reduceMotion ? undefined : { opacity: 0.2, filter: "blur(16px)" }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -3, scale: 1.015, boxShadow: "0 12px 28px rgba(0,0,0,0.42), 0 0 28px rgba(139,92,246,0.22)", borderColor: "rgba(139,92,246,0.45)" }
                  }
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="relative aspect-[16/10] w-full rounded-2xl border border-dashed border-white/20 bg-white/[0.03]"
                >
                  <TiltedCard
                    imageSrc="/after-store-reference-v6.png"
                    altText="After example storefront reference"
                    captionText="Custom Stratova build"
                    containerHeight="100%"
                    containerWidth="100%"
                    imageHeight="100%"
                    imageWidth="100%"
                    rotateAmplitude={12}
                    scaleOnHover={1.05}
                    showTooltip={false}
                    displayOverlayContent={false}
                    disableTilt={isMobileViewport}
                  />
                </motion.div>
                <p className="text-lg font-medium text-zinc-100">Feels premium. Converts higher.</p>
                <ul className="space-y-2.5 text-sm leading-relaxed text-zinc-300">
                  {afterBulletPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>

            <motion.div
              variants={sectionItem}
              className="h-px w-full bg-gradient-to-r from-transparent via-violet-400/55 to-transparent"
              animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </section>

        <section id="outcomes" className="relative scroll-mt-28 py-20 md:py-28">
          <div className="space-y-8">
            <SectionReveal reduced={Boolean(reduceMotion)}>
              <p className="text-center text-xs uppercase tracking-[0.2em] text-violet-300">CONVERSION OUTCOMES</p>
            </SectionReveal>
            <SectionReveal reduced={Boolean(reduceMotion)} delay={0.04}>
              <h2 className="mx-auto max-w-4xl text-center text-4xl font-semibold tracking-[0.03em] text-white md:text-5xl">
                What this means for your store.
              </h2>
            </SectionReveal>
            <SectionReveal reduced={Boolean(reduceMotion)} delay={0.08}>
              <p className="mx-auto max-w-4xl text-center text-sm leading-relaxed text-zinc-300 md:text-lg">
                A custom storefront isn&apos;t decoration. It&apos;s a sharper story, higher trust, and a smoother path
                to checkout.
              </p>
            </SectionReveal>

            <div className="grid gap-x-10 gap-y-10 pt-4 md:grid-cols-2 xl:grid-cols-3">
              <SectionReveal reduced={Boolean(reduceMotion)} delay={0.05}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -2 }} className="group border-t border-white/12 pt-4">
                  <Sparkles className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 text-xl font-medium text-white">Stand out instantly</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap">
                    Most stores blend in. Custom makes you memorable.
                  </p>
                  <span className="mt-4 block h-px w-0 bg-violet-300/70 transition-all duration-300 group-hover:w-16" />
                </motion.article>
              </SectionReveal>

              <SectionReveal reduced={Boolean(reduceMotion)} delay={0.1}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -2 }} className="group border-t border-white/12 pt-4">
                  <ShieldCheck className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 text-xl font-medium text-white">Higher trust = higher conversion</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap">
                    Premium design cuts hesitation and boosts confidence.
                  </p>
                  <span className="mt-4 block h-px w-0 bg-violet-300/70 transition-all duration-300 group-hover:w-16" />
                </motion.article>
              </SectionReveal>

              <SectionReveal reduced={Boolean(reduceMotion)} delay={0.15}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -2 }} className="group border-t border-white/12 pt-4">
                  <Zap className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 text-xl font-medium text-white">Faster site, fewer drop-offs</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap">
                    Performance-first builds keep mobile shoppers moving.
                  </p>
                  <span className="mt-4 block h-px w-0 bg-violet-300/70 transition-all duration-300 group-hover:w-16" />
                </motion.article>
              </SectionReveal>

              <SectionReveal reduced={Boolean(reduceMotion)} delay={0.2}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -2 }} className="group border-t border-white/12 pt-4">
                  <Star className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 text-xl font-medium text-white">Clearer product story</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap">
                    Position best sellers the way people actually buy.
                  </p>
                  <span className="mt-4 block h-px w-0 bg-violet-300/70 transition-all duration-300 group-hover:w-16" />
                </motion.article>
              </SectionReveal>

              <SectionReveal reduced={Boolean(reduceMotion)} delay={0.25}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -2 }} className="group border-t border-white/12 pt-4">
                  <ArrowRight className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 text-xl font-medium text-white">Fewer clicks to purchase</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap">
                    Smoother journey: landing {"->"} product {"->"} checkout.
                  </p>
                  <span className="mt-4 block h-px w-0 bg-violet-300/70 transition-all duration-300 group-hover:w-16" />
                </motion.article>
              </SectionReveal>

              <SectionReveal reduced={Boolean(reduceMotion)} delay={0.3}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -2 }} className="group border-t border-white/12 pt-4">
                  <ChartColumn className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <h3 className="mt-3 text-xl font-medium text-white">Higher AOV (by layout)</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:whitespace-nowrap">
                    Bundles and upsells built right into page structure.
                  </p>
                  <span className="mt-4 block h-px w-0 bg-violet-300/70 transition-all duration-300 group-hover:w-16" />
                </motion.article>
              </SectionReveal>
            </div>

            <SectionReveal reduced={Boolean(reduceMotion)} delay={0.1} className="hidden md:block">
              <div className="mx-auto mt-4 max-w-4xl border border-violet-400/30 px-6 py-5 text-center shadow-[0_0_40px_rgba(139,92,246,0.12)]">
                <p className="text-base font-medium text-zinc-100 md:text-lg">
                  Example: Improve conversion from 1.5% {"->"} 2.0% on 50k visits/month {"->"} +250 more orders.
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  We estimate impact after a quick audit and traffic review.
                </p>
              </div>
            </SectionReveal>

            <SectionReveal reduced={Boolean(reduceMotion)} delay={0.12}>
              <div className="flex w-full max-w-sm flex-col items-stretch justify-center gap-3 pt-4 md:max-w-none md:flex-row md:items-center">
                <motion.a
                  href="#pricing"
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01, boxShadow: "0px 12px 32px rgba(139,92,246,0.35)" }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96, y: 0 }}
                  transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-7 py-3 text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:w-auto"
                >
                  See Packages <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </motion.a>
                <motion.button
                  type="button"
                  onClick={() => setIsFormModalOpen(true)}
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01, borderColor: "rgba(139,92,246,0.7)" }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96, y: 0 }}
                  transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 px-7 py-3 text-base font-semibold text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:w-auto"
                >
                  Book a Call
                </motion.button>
              </div>
              <p className="pt-3 text-center text-xs text-zinc-500">You get a store that looks custom - because it is.</p>
            </SectionReveal>
          </div>
        </section>

        <section id="process" className="relative scroll-mt-28 py-24 md:py-28">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 18, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">THE STRATOVA METHOD</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[0.03em] text-white md:text-5xl">
              <span className="md:hidden">
                <span className="block">Built with intention.</span>
                <span className="block">Not templates.</span>
              </span>
              <span className="hidden md:inline">Built with intention. Not templates.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-lg">
              <span className="md:hidden">
                Stratova build follows a performance-first structure designed around how customers actually shop.
              </span>
              <span className="hidden md:inline">
                Every Stratova build follows a performance-first structure designed around how customers actually shop.
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 20, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.12 }}
            transition={reduceMotion ? undefined : { duration: 0.55, ease: "easeOut", delay: 0.08 }}
            className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2"
          >
            {[
              {
                step: "01",
                title: "Strategy First",
                description:
                  "We audit your traffic, products, and positioning before designing anything. Your layout starts with data - not decoration.",
              },
              {
                step: "02",
                title: "Conversion Architecture",
                description:
                  "Your storefront is structured around scroll behavior, buying psychology, and mobile-first decision making.",
              },
              {
                step: "03",
                title: "Performance Optimization",
                description:
                  "Clean structure. Lean code. Speed prioritized for real-world mobile traffic - where most sales happen.",
              },
              {
                step: "04",
                title: "Launch & Refine",
                description:
                  "We launch with precision, monitor behavior, and refine key friction points to maximize results.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={reduceMotion ? undefined : { opacity: 0.15, y: 22, filter: "blur(10px)" }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.16 }}
                transition={reduceMotion ? undefined : { duration: 0.45, ease: "easeOut", delay: 0.12 + index * 0.08 }}
                className="text-left"
              >
                <p className="text-5xl font-semibold leading-none tracking-tight text-white/15 md:text-6xl">{item.step}</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">{item.description}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section id="pricing" className="relative scroll-mt-28 py-24 md:py-28">
          <motion.div
            variants={pricingHeaderStagger}
            initial={reduceMotion ? undefined : "hidden"}
            whileInView={reduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.15 }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">INVESTMENT</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[0.03em] text-white md:text-5xl">
              <span className="md:hidden">
                <span className="block">Simple packages.</span>
                <span className="block">Premium outcomes.</span>
              </span>
              <span className="hidden md:inline">Simple packages. Premium outcomes.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Start with a custom storefront that looks built-not bought. Add revenue systems when you&apos;re ready.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 16, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.08 }}
            className="mt-10 flex justify-center"
          >
            <div className="inline-flex rounded-2xl border border-white/15 bg-black/35 p-1">
              {(["monthly", "one-time"] as BillingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBillingMode(mode)}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                    billingMode === mode ? "bg-violet-500 text-white" : "text-zinc-300 hover:text-white",
                  )}
                  aria-pressed={billingMode === mode}
                >
                  {mode === "monthly" ? "Monthly" : "One-Time"}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 20, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.14 }}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.14 }}
            className="mt-12 grid gap-10 lg:grid-cols-2"
          >
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -3, boxShadow: "0 0 26px rgba(139,92,246,0.15)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 p-6 md:p-7"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Core Build</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Custom Shopify Build</h3>
              <p className="mt-3 text-3xl font-semibold text-violet-200">Starting at $1499</p>
              <p className="mt-2 text-sm text-zinc-400">+ $29/mo server running cost</p>

              <ul className="mt-6 space-y-2.5 text-sm text-zinc-300">
                {[
                  "Custom sections + brand-first layout",
                  "Mobile-first design (where most sales happen)",
                  "Performance-focused build for speed",
                  "Conversion-optimized structure",
                  "Launch-ready handoff",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => setIsFormModalOpen(true)}
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01, boxShadow: "0px 12px 32px rgba(139,92,246,0.35)" }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96, y: 0 }}
                  transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  Book a Call
                </motion.button>
                <a
                  href="#before-after"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  See Before &amp; After
          </a>
        </div>
            </motion.div>

            <motion.div
              whileHover={reduceMotion ? undefined : { y: -3, boxShadow: "0 0 26px rgba(139,92,246,0.14)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 p-6 md:p-7"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Add-ons</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Revenue Add-ons</h3>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h4 className="text-lg font-semibold text-white">AI Abandoned Cart Recovery</h4>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`abandoned-${billingMode}`}
                        initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg font-semibold text-violet-200"
                      >
                        {billingMode === "monthly" ? "$179/mo" : "$1299"}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                      Recover lost checkouts with smart follow-ups
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                      On-brand messaging + timing
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                      Discount logic when needed (not always)
                    </li>
                  </ul>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h4 className="text-lg font-semibold text-white">AI Live Chat Bot</h4>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`chat-${billingMode}`}
                        initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg font-semibold text-violet-200"
                      >
                        {billingMode === "monthly" ? "$99/mo" : "$699"}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                      Answers questions instantly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                      Guides customers to the right product
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                      Reduces friction before checkout
                    </li>
                  </ul>
                </div>
              </div>

              <p className="mt-6 text-xs text-zinc-400">Add-ons can be installed after launch.</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 20, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.22 }}
            className="mt-10 rounded-2xl border border-violet-400/35 p-6 shadow-[0_0_40px_rgba(139,92,246,0.13)] md:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-white">Stratova Growth Stack</h3>
              <span className="rounded-full border border-violet-300/45 bg-violet-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                Most Popular
              </span>
            </div>
            <p className="mt-2 text-zinc-300">The full upgrade: custom storefront + both add-ons.</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={`bundle-${billingMode}`}
                initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-5"
              >
                <p className="text-3xl font-semibold text-violet-200">
                  {billingMode === "monthly" ? "From $1499 + $278/mo" : "$1499 + $1998 one-time"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">+ $29/mo server</p>
              </motion.div>
            </AnimatePresence>

            <ul className="mt-6 grid gap-2 text-sm text-zinc-300 md:grid-cols-3 md:gap-3">
              {[
                "Custom build that doesn't look templated",
                "Revenue systems layered in after launch",
                "One team, one roadmap",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <motion.button
              type="button"
              onClick={() => setIsFormModalOpen(true)}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01, boxShadow: "0px 12px 32px rgba(139,92,246,0.35)" }}
              whileTap={reduceMotion ? undefined : { scale: 0.96, y: 0 }}
              transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              Get the Growth Stack
            </motion.button>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, filter: "blur(8px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.28 }}
            className="mt-10"
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="mt-5 flex flex-col items-center gap-2 text-xs text-zinc-400 md:flex-row md:justify-center md:gap-6">
              <span>No long-term contract required.</span>
              <span>You own your store. We build it to last.</span>
              <span>Limited builds per month to keep quality high.</span>
            </div>
          </motion.div>
        </section>

        <section id="testimonials" className="relative scroll-mt-28 py-24 md:py-28">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 18, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/90">RESULTS</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[0.03em] text-white md:text-5xl">
              <span className="md:hidden">
                <span className="block">What changes</span>
                <span className="block">after launch.</span>
              </span>
              <span className="hidden md:inline">What changes after launch.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl whitespace-nowrap text-xs leading-relaxed text-zinc-300 md:whitespace-normal md:text-lg">
              Custom builds don&apos;t just look better. They perform better.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                metric: "+18% Conversion Increase",
                quote:
                  "Customers said our store finally felt premium. The checkout flow feels smoother and more intentional.",
                by: "— Alex M., Apparel Brand",
              },
              {
                metric: "$4,200/mo Revenue Lift",
                quote:
                  "The redesign alone paid for itself. The brand finally stands out instead of blending in.",
                by: "— Sarah L., Beauty Store",
              },
              {
                metric: "Mobile Bounce Rate ↓ 32%",
                quote: "Speed made the biggest difference. Mobile traffic actually converts now.",
                by: "— Daniel R., DTC Founder",
              },
            ].map((item, index) => (
              <motion.div
                key={item.metric}
                initial={reduceMotion ? undefined : { opacity: 0.15, y: 20, filter: "blur(10px)" }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: reduceMotion ? 0 : index * 0.08 + 0.08 }}
                whileHover={reduceMotion ? undefined : { y: -3, boxShadow: "0 0 26px rgba(139,92,246,0.14)" }}
                className="border-t border-white/12 pt-5 text-left"
              >
                <p className="text-2xl font-semibold text-white md:text-[1.7rem]">{item.metric}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{item.quote}</p>
                <p className="mt-4 text-xs text-zinc-500">{item.by}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 10, filter: "blur(8px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.26 }}
            className="mt-10 text-center text-xs text-zinc-500"
          >
            Results vary. We estimate impact after a quick audit.
          </motion.p>
        </section>

        <section id="cta" className="relative overflow-hidden scroll-mt-28 py-28 md:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-22%] opacity-65"
            style={{
              background:
                "radial-gradient(56% 44% at 50% 49%, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.11) 32%, rgba(139,92,246,0.05) 54%, rgba(139,92,246,0.02) 68%, rgba(7,7,11,0) 84%), radial-gradient(40% 30% at 50% 49%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 34%, rgba(255,255,255,0.015) 52%, rgba(255,255,255,0) 72%)",
              filter: "blur(28px)",
            }}
          />
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0.15, y: 18, filter: "blur(10px)" }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative text-center"
          >
            <h2 className="mx-auto max-w-5xl text-4xl font-semibold tracking-[0.03em] text-white md:text-6xl">
              <span className="block">Stop Looking</span>
              <span className="block">Like every other Shopify store.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl whitespace-nowrap text-xs leading-relaxed text-zinc-300 md:whitespace-normal md:text-xl">
              Custom storefront. Clear positioning. Built to convert.
            </p>

            <div className="mt-12 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 md:mt-9 md:max-w-none md:flex-row md:items-center">
              <motion.button
                type="button"
                onClick={() => setIsFormModalOpen(true)}
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01, boxShadow: "0px 12px 30px rgba(139,92,246,0.34)" }}
                whileTap={reduceMotion ? undefined : { scale: 0.96, y: 0 }}
                transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:w-auto"
              >
                Book a Call
              </motion.button>
              <motion.a
                href="#pricing"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01, boxShadow: "0px 10px 26px rgba(139,92,246,0.22)" }}
                whileTap={reduceMotion ? undefined : { scale: 0.96, y: 0 }}
                transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:w-auto"
              >
                See Packages
              </motion.a>
            </div>

            <p className="mt-5 text-xs text-zinc-500">Limited builds per month to keep quality high.</p>
          </motion.div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/35">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-12 text-center text-zinc-300">
          <motion.div
            whileHover={reduceMotion ? undefined : { y: -4, scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98, y: 0 }}
            transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
          >
            <Image src="/stratova-logo.png" alt="Stratova logo" width={84} height={84} className="h-20 w-20 rounded-xl md:h-[84px] md:w-[84px]" />
          </motion.div>
          <p className="mt-4 text-xl font-semibold tracking-[0.14em] text-white">STRATOVA</p>
          <p className="mt-3 max-w-md text-sm text-zinc-400">
            <span className="md:hidden">Custom Shopify Web Development</span>
            <span className="hidden md:inline">Custom Shopify development and AI automations for faster growth.</span>
          </p>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-500">© Stratova. All rights reserved.</div>
      </footer>

      <AnimatePresence>
        {isFormModalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-3 py-6 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close modal backdrop"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsFormModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Book a call form"
              initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22 }}
              className="relative z-10 my-4 max-h-[80dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-white/15 bg-[#0b0b13] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.7)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:my-4 sm:max-h-[calc(100dvh-2rem)] sm:p-5 md:p-6"
            >
              <LeadForm
                title="Book your strategy call"
                subtitle="Tell us about your store and we’ll map your highest ROI opportunities."
                onClose={() => setIsFormModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
