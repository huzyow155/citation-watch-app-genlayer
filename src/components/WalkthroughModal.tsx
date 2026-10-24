import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileCheck,
  Search,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Decentralized Citation Integrity",
    subtitle: "Tracking Wikipedia drift on GenLayer Studionet (Preview)",
    description:
      "Online citations decay when web pages and Wikipedia articles are edited, reorganized, or deleted. CitationWatch anchors verified quotation baselines on GenLayer intelligent contracts, evaluating future revisions with AI validator consensus.",
    icon: <BookOpen className="h-7 w-7 text-cyan-400" aria-hidden="true" />,
    highlights: [
      "Anchors exact baseline revision oldid and quote.",
      "Calculates an immutable sha256 fingerprint.",
      "Prevents stealth revisions and citation link rot.",
    ],
  },
  {
    title: "1. Register Baseline Citation",
    subtitle: "Creating the immutable baseline record",
    description:
      "Enter any Wikipedia article URL, baseline revision oldid, and the exact quotation to protect. When submitted, the SourceDriftLedger contract accepts and records the citation with a deterministic sha256 fingerprint.",
    icon: <FileCheck className="h-7 w-7 text-cyan-400" aria-hidden="true" />,
    highlights: [
      "Normalizes quote whitespace and typographic quotes.",
      "Derives a unique 12-character citation ID.",
      "Recorded permanently on GenLayer Studionet (Preview).",
    ],
  },
  {
    title: "2. Audit Source Drift",
    subtitle: "Validator consensus evaluates revisions and live web",
    description:
      "Trigger an audit against a newer revision or the live Wikipedia article. Decentralized validators independently fetch the target HTML, parse passages, run language models, and agree on element status: UNCHANGED, REPHRASED, CHANGED, or ABSENT.",
    icon: <Search className="h-7 w-7 text-cyan-400" aria-hidden="true" />,
    highlights: [
      "Cosmetic changes (punctuation, rephrasing) remain intact.",
      "Material changes (factual divergence, deletions) trigger DRIFTED.",
      "Validators reach consensus on element verdicts.",
    ],
  },
  {
    title: "3. Publish Verifiable Claims",
    subtitle: "Anchor external facts directly to citation IDs",
    description:
      "Researchers, journalists, and protocols can register public factual claims on the ClaimsBoard contract that reference a specific citation ID. Claims automatically track the underlying citation's drift status.",
    icon: <Award className="h-7 w-7 text-cyan-400" aria-hidden="true" />,
    highlights: [
      "Links human assertions to cryptographic citation IDs.",
      "Transparent audit trail visible on the block explorer.",
      "Prevents ungrounded or out-of-date factual claims.",
    ],
  },
  {
    title: "4. Dynamic ClaimsBoard Badges",
    subtitle: "Real-time embeddable trust status",
    description:
      "Once an audit is accepted by validators, claim badges can be refreshed on-chain. If the referenced source has drifted materially, the badge updates from VERIFIED to DRIFTED, alerting downstream readers immediately.",
    icon: <ShieldCheck className="h-7 w-7 text-cyan-400" aria-hidden="true" />,
    highlights: [
      "Dynamic on-chain status: VERIFIED, DRIFTED, or DISPUTED.",
      "Embeddable badge snippets for blogs, docs, and papers.",
      "Zero manual maintenance: synchronized with drift audits.",
    ],
  },
];

const STORAGE_KEY = "citationwatch_tour_dismissed";

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight") {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl focus:outline-none">
        {/* Top bar: step indicator & close button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Interactive Guide &middot; Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Skip guided tour"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={TOUR_STEPS.length}>
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="mt-5">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40">
              {step.icon}
            </div>
            <div>
              <h2 id="walkthrough-title" className="text-lg font-bold text-white tracking-tight">
                {step.title}
              </h2>
              <p className="text-xs text-slate-300">{step.subtitle}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-200">
            {step.description}
          </p>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Key Highlights</span>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
              {step.highlights.map((h, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">&bull;</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dots & Nav Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          {/* Step dots */}
          <div className="flex space-x-1.5" aria-hidden="true">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? "w-6 bg-cyan-400" : "w-2 bg-slate-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center space-x-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center space-x-1.5 rounded-xl bg-cyan-500 px-4 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
              {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
