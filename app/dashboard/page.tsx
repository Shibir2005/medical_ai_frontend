"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
  ClipboardList,
  ArrowLeft,
  Send,
  Stethoscope,
  Users,
  BarChart2,
  Heart,
  Brain,
  Wind,
  Shield,
  RefreshCw,
  ListChecks,
  History,
} from "lucide-react";
import { toast } from "sonner";
import AssessmentHistory from "@/components/Assessmenthistory"; // adjust path as needed

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentType {
  reference_id: string;
  name: string;
  description: string;
}

interface Option {
  option_id: string;
  option_text: string;
}

interface Question {
  question_id: string;
  question_text: string;
  input_type: "mcq" | "number" | "text";
  options: Option[];
}

interface Section {
  section_id: string;
  name: string;
  questions: Question[];
}

interface AssessmentDetail {
  assessment_type_id: string;
  name: string;
  description: string;
  sections: Section[];
}

interface Problem {
  name: string;
  cause: string;
  consequence: string;
  remedy: string;
}

interface Recommendation {
  category: string;
  action: string;
  goal: string;
}

interface AssessmentResult {
  risk_level: string;
  problems: Problem[];
  recommendations: Recommendation[];
}

interface DiagnoseResponse {
  session_id: string;
  assessment_type: string;
  assessment: AssessmentResult;
}

interface DashboardStats {
  available_assessments: number;
  last_24h_scans: number;
  last_risk_level: string;
  total_scans: number;

}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAssessmentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("cardio") || lower.includes("heart")) return Heart;
  if (lower.includes("neuro") || lower.includes("brain") || lower.includes("diabetes")) return Brain;
  if (lower.includes("respiratory") || lower.includes("lung")) return Wind;
  if (lower.includes("general")) return Shield;
  return Stethoscope;
}

const riskStyles: Record<string, { badge: string; ring: string; color: string; label: string }> = {
  critical: {
    badge: "text-red-400 bg-red-500/10 border-red-500/30",
    ring: "#ef4444",
    color: "text-red-400",
    label: "Critical",
  },
  high: {
    badge: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    ring: "#f97316",
    color: "text-orange-400",
    label: "High",
  },
  moderate: {
    badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    ring: "#eab308",
    color: "text-yellow-400",
    label: "Moderate",
  },
  low: {
    badge: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    ring: "#14b8a6",
    color: "text-teal-400",
    label: "Low",
  },
};

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewPage({ assessmentTypes, stats }: { assessmentTypes: AssessmentType[]; stats: DashboardStats | null }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Clinical Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Select an assessment from the sidebar to begin a patient evaluation.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available Assessments", value: stats?.available_assessments.toString() ?? "—", icon: ClipboardList },
          { label: "Total Scans", value: stats?.total_scans.toString() ?? "—", icon: Users },
          { label: "Scans Last 24h", value: stats?.last_24h_scans.toString() ?? "—", icon: Activity },
          { label: "Last Risk Level", value: stats?.last_risk_level.toString() ?? "—", icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#0f1318] border border-white/5 rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          Available Assessments
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {assessmentTypes.map((type) => {
            const Icon = getAssessmentIcon(type.name);
            return (
              <a
                key={type.reference_id}
                href={`/dashboard?assessment=${type.reference_id}`}
                className="bg-[#0f1318] border border-white/5 hover:border-teal-500/30 rounded-2xl p-5 transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-sm">{type.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{type.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Question Input ───────────────────────────────────────────────────────────

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (val: string) => void;
}) {
  if (question.input_type === "mcq") {
    return (
      <div className="grid gap-2 mt-3">
        {question.options.map((opt) => (
          <button
            key={opt.option_id}
            type="button"
            onClick={() => onChange(opt.option_text)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              value === opt.option_text
                ? "bg-teal-500/10 border-teal-500/40 text-teal-400"
                : "bg-white/3 border-white/8 text-slate-300 hover:border-white/20 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  value === opt.option_text ? "border-teal-400" : "border-slate-600"
                }`}
              >
                {value === opt.option_text && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 block" />
                )}
              </span>
              {opt.option_text}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (question.input_type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a number..."
        className="mt-3 w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all"
      />
    );
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      rows={3}
      className="mt-3 w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all resize-none"
    />
  );
}

// ─── Prediction Result ────────────────────────────────────────────────────────

const categoryStyles: Record<string, string> = {
  medical: "bg-red-500/10 text-red-400",
  lifestyle: "bg-teal-500/10 text-teal-400",
  monitoring: "bg-yellow-500/10 text-yellow-400",
};

function PredictionResultView({
  result,
  assessmentType,
  onReset,
  onBackToSections,
}: {
  result: AssessmentResult;
  assessmentType: string;
  onReset: () => void;
  onBackToSections: () => void;
}) {
  const level = result.risk_level?.toLowerCase() || "low";
  const style = riskStyles[level] || riskStyles.low;
  const scoreMap: Record<string, number> = { low: 22, moderate: 55, high: 76, critical: 95 };
  const score = scoreMap[level] ?? 50;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToSections}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sections
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>

      <div className="bg-[#0f1318] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1f28" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={style.ring}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${score * 2.638} 263.8`}
                style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold font-mono ${style.color}`}>{score}</span>
              <span className="text-[10px] text-slate-600 mt-0.5">risk score</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">{assessmentType} Assessment</p>
            <p className={`text-2xl font-bold mb-2 ${style.color}`}>{style.label} Risk</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${style.badge}`}>
              {level === "low" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {style.label}
            </div>
          </div>
        </div>
      </div>

      {result.problems?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Identified Problems</p>
          <div className="space-y-3">
            {result.problems.map((prob, i) => (
              <div key={i} className="bg-[#0f1318] border border-white/5 rounded-2xl p-5">
                <p className="text-sm font-semibold text-white mb-3">{prob.name}</p>
                <div className="space-y-2">
                  {[
                    { label: "Cause", value: prob.cause },
                    { label: "Consequence", value: prob.consequence },
                    { label: "Remedy", value: prob.remedy },
                  ].map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-[80px_1fr] gap-x-3 text-xs">
                      <span className="text-slate-500 font-medium pt-0.5">{label}</span>
                      <span className="text-slate-300 leading-relaxed">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recommendations</p>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => {
              const catKey = rec.category.toLowerCase();
              const catStyle = categoryStyles[catKey] || "bg-white/5 text-slate-400";
              return (
                <div key={i} className="bg-[#0f1318] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-md shrink-0 mt-0.5 ${catStyle}`}>
                    {rec.category}
                  </span>
                  <div>
                    <p className="text-sm text-slate-200 leading-relaxed mb-1">{rec.action}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{rec.goal}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          This result is AI-generated for clinical decision-support only. Always consult a qualified physician before making medical decisions.
        </p>
      </div>
    </div>
  );
}

// ─── Section List ─────────────────────────────────────────────────────────────

function SectionList({
  detail,
  onSelectSection,
  onViewHistory,
}: {
  detail: AssessmentDetail;
  onSelectSection: (section: Section) => void;
  onViewHistory: () => void;
}) {
  const Icon = getAssessmentIcon(detail.name);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{detail.name}</h1>
            <p className="text-slate-500 text-sm">{detail.description}</p>
          </div>
        </div>

        {/* History button */}
        <button
          onClick={onViewHistory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 transition-all shrink-0"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/3 border border-white/5 rounded-xl px-4 py-3">
        <ListChecks className="w-4 h-4 text-slate-400 shrink-0" />
        Choose a questionnaire set below to start. Each set covers a different clinical area.
      </div>

      {/* Section cards */}
      <div className="space-y-3">
        {detail.sections.map((section, i) => (
          <button
            key={section.section_id}
            onClick={() => onSelectSection(section)}
            className="w-full bg-[#0f1318] border border-white/5 hover:border-teal-500/30 rounded-2xl p-5 transition-all group flex items-center gap-4 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-teal-500/10 border border-white/8 group-hover:border-teal-500/20 flex items-center justify-center shrink-0 transition-all">
              <span className="text-sm font-bold text-slate-500 group-hover:text-teal-400 transition-colors font-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm group-hover:text-teal-50 transition-colors">
                {section.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Question Form ────────────────────────────────────────────────────

function SectionQuestionForm({
  detail,
  section,
  onBack,
  onResult,
}: {
  detail: AssessmentDetail;
  section: Section;
  onBack: () => void;
  onResult: (result: AssessmentResult, assessmentType: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = section.questions.every((q) => answers[q.question_id]?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const payload = {
      assessment_type_id: detail.assessment_type_id,
      answers: section.questions.map((q) => ({
        question_id: q.question_id,
        answer: answers[q.question_id] || "",
      })),
    };

    try {
      const submitRes = await fetch(`${API_BASE}/api/health/answers/submit/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const submitData = await submitRes.json();
      const session_id = submitData.session_id;

      const diagnoseRes = await fetch(`${API_BASE}/api/health/diagnose/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, assessment_type_id: detail.assessment_type_id }),
      });
      const diagnoseData = await diagnoseRes.json();

      onResult(
        diagnoseData.assessment ?? { risk_level: "moderate", problems: [], recommendations: [] },
        diagnoseData.assessment_type ?? detail.name,
      );
    } catch {
      setError("Failed to submit answers. Please try again.");
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = getAssessmentIcon(detail.name);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button onClick={onBack} className="hover:text-teal-400 transition-colors truncate">
              {detail.name}
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-300 truncate">{section.name}</span>
          </div>
          <h1 className="text-lg font-bold text-white">{section.name}</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {section.questions.length} question{section.questions.length !== 1 ? "s" : ""} · Answer all to submit
          </p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to questionnaire sets
      </button>

      <div className="space-y-4">
        {section.questions.map((question, qi) => (
          <div key={question.question_id} className="bg-[#0f1318] border border-white/5 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                {qi + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 leading-relaxed">{question.question_text}</p>
                <QuestionInput
                  question={question}
                  value={answers[question.question_id] || ""}
                  onChange={(val) => handleAnswer(question.question_id, val)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-600">
          {Object.keys(answers).length} / {section.questions.length} answered
        </p>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/30 disabled:cursor-not-allowed text-white transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Run Prediction
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Assessment Flow Controller ───────────────────────────────────────────────

type FlowStep =
  | { step: "sections" }
  | { step: "questions"; section: Section }
  | { step: "result"; result: AssessmentResult; assessmentType: string; section: Section }
  | { step: "history" };

function AssessmentFlow({ assessmentId }: { assessmentId: string }) {
  const [detail, setDetail] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowStep>({ step: "sections" });

  useEffect(() => {
    setLoading(true);
    setFlow({ step: "sections" });
    fetch(`${API_BASE}/api/health/assessment-types/${assessmentId}/questions/`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        setDetail(data.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load assessment. Please try again.");
        setLoading(false);
      });
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="text-center py-32">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{error ?? "Something went wrong."}</p>
      </div>
    );
  }

  // ── History view ──
  if (flow.step === "history") {
    return (
      <AssessmentHistory
        assessmentId={assessmentId}
        assessmentName={detail.name}
        assessmentTypeId={detail.assessment_type_id}
        onBack={() => setFlow({ step: "sections" })}
      />
    );
  }

  if (flow.step === "sections") {
    return (
      <SectionList
        detail={detail}
        onSelectSection={(section) => setFlow({ step: "questions", section })}
        onViewHistory={() => setFlow({ step: "history" })}
      />
    );
  }

  if (flow.step === "questions") {
    return (
      <SectionQuestionForm
        detail={detail}
        section={flow.section}
        onBack={() => setFlow({ step: "sections" })}
        onResult={(result, assessmentType) =>
          setFlow({ step: "result", result, assessmentType, section: flow.section })
        }
      />
    );
  }

  if (flow.step === "result") {
    return (
      <PredictionResultView
        result={flow.result}
        assessmentType={flow.assessmentType}
        onReset={() => setFlow({ step: "questions", section: flow.section })}
        onBackToSections={() => setFlow({ step: "sections" })}
      />
    );
  }

  return null;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment");
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health/assessment-types/`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setAssessmentTypes(data.data || []))
      .catch(() => {});
      fetchStats();
  }, []);

  const fetchStats = async () => {
    fetch(`${API_BASE}/api/health/dashboard/stats/`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
      })
      .catch(() => {
        console.error("Failed to fetch dashboard stats");
      });
    // Placeholder for fetching dashboard stats if needed in the future
  };

  if (assessmentId) {
    return <AssessmentFlow key={assessmentId} assessmentId={assessmentId} />;
  }

  return <OverviewPage stats={stats} assessmentTypes={assessmentTypes} />;
}