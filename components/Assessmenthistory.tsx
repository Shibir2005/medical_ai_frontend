"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Clock,
  ClipboardList,
  FileText,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Stethoscope,
  Heart,
  Brain,
  Wind,
  Shield,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionAnswer {
  question: string;
  answer: string;
}

interface Session {
  session_id: string;
  created_at: string;
  answers: SessionAnswer[];
}

interface SessionsResponse {
  assessment_type: string;
  total_sessions: number;
  sessions: Session[];
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

interface DiagnoseReport {
  report_id: string;
  session_id: string;
  assessment_type_id: string;
  assessment_type: string;
  created_at: string;
  risk_level: string;
  problems: Problem[];
  recommendations: Recommendation[];
}

interface DiagnoseHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DiagnoseReport[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAssessmentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("cardio") || lower.includes("heart")) return Heart;
  if (lower.includes("neuro") || lower.includes("brain") || lower.includes("diabetes")) return Brain;
  if (lower.includes("respiratory") || lower.includes("lung") || lower.includes("breath")) return Wind;
  if (lower.includes("general")) return Shield;
  return Stethoscope;
}

const riskStyles: Record<string, { badge: string; ring: string; color: string; dot: string }> = {
  critical: {
    badge: "text-red-400 bg-red-500/10 border-red-500/30",
    ring: "#ef4444",
    color: "text-red-400",
    dot: "bg-red-400",
  },
  high: {
    badge: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    ring: "#f97316",
    color: "text-orange-400",
    dot: "bg-orange-400",
  },
  moderate: {
    badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    ring: "#eab308",
    color: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  low: {
    badge: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    ring: "#14b8a6",
    color: "text-teal-400",
    dot: "bg-teal-400",
  },
};

const categoryStyles: Record<string, string> = {
  medical: "bg-red-500/10 text-red-400",
  lifestyle: "bg-teal-500/10 text-teal-400",
  monitoring: "bg-yellow-500/10 text-yellow-400",
  nutrition: "bg-green-500/10 text-green-400",
  "physical activity": "bg-blue-500/10 text-blue-400",
  "medical follow‑up": "bg-purple-500/10 text-purple-400",
  "education & support": "bg-orange-500/10 text-orange-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskStyle(riskLevel: string) {
  return riskStyles[riskLevel.toLowerCase()] || riskStyles.low;
}

// ─── Report Detail View ───────────────────────────────────────────────────────

function ReportDetailView({
  report,
  session,
  onBack,
}: {
  report: DiagnoseReport;
  session: Session | undefined;
  onBack: () => void;
}) {
  const style = getRiskStyle(report.risk_level);
  const scoreMap: Record<string, number> = { low: 22, moderate: 55, high: 76, critical: 95 };
  const score = scoreMap[report.risk_level.toLowerCase()] ?? 50;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to history
      </button>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatDate(report.created_at)}</span>
        <span className="mx-1">·</span>
        <span className="font-mono text-slate-700 truncate">{report.session_id.slice(0, 8)}…</span>
      </div>

      {/* Score Card */}
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
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold font-mono ${style.color}`}>{score}</span>
              <span className="text-[10px] text-slate-600 mt-0.5">risk score</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">{report.assessment_type}</p>
            <p className={`text-2xl font-bold mb-2 ${style.color}`}>{report.risk_level} Risk</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${style.badge}`}>
              {report.risk_level.toLowerCase() === "low" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {report.risk_level}
            </div>
          </div>
        </div>
      </div>

      {/* Session Answers */}
      {session && session.answers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Patient Responses
          </p>
          <div className="bg-[#0f1318] border border-white/5 rounded-2xl divide-y divide-white/5">
            {session.answers.map((a, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                <MessageSquare className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">{a.question}</p>
                  <p className="text-sm text-white font-medium">{a.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problems */}
      {report.problems?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Identified Problems
          </p>
          <div className="space-y-3">
            {report.problems.map((prob, i) => (
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

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Recommendations
          </p>
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => {
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

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          This result is AI-generated for clinical decision-support only. Always consult a qualified physician before making medical decisions.
        </p>
      </div>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({
  report,
  session,
  onClick,
}: {
  report: DiagnoseReport;
  session: Session | undefined;
  onClick: () => void;
}) {
  const style = getRiskStyle(report.risk_level);

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#0f1318] border border-white/5 hover:border-teal-500/25 rounded-2xl p-5 transition-all group flex items-center gap-4 text-left"
    >
      {/* Risk dot */}
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
            {report.risk_level}
          </span>
          {report.problems.length > 0 && (
            <span className="text-xs text-slate-600">
              {report.problems.length} problem{report.problems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          <span>{formatDate(report.created_at)}</span>
          <span className="mx-0.5">·</span>
          <span className="font-mono truncate">{report.session_id.slice(0, 8)}…</span>
        </div>
        {session && (
          <p className="text-xs text-slate-600 mt-1 truncate">
            {session.answers.length} response{session.answers.length !== 1 ? "s" : ""} recorded
          </p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors shrink-0" />
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyHistory({ assessmentName }: { assessmentName: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-6 h-6 text-slate-600" />
      </div>
      <p className="text-slate-400 font-medium text-sm mb-1">No history yet</p>
      <p className="text-slate-600 text-xs max-w-xs mx-auto">
        Complete a {assessmentName} assessment to see your diagnosis history here.
      </p>
    </div>
  );
}

// ─── Main AssessmentHistory Component ────────────────────────────────────────

type HistoryView =
  | { view: "list" }
  | { view: "detail"; report: DiagnoseReport };

export default function AssessmentHistory({
  assessmentId,
  assessmentName,
  assessmentTypeId,
  onBack,
}: {
  assessmentId: string;        // reference_id used in sidebar / URL (for sessions API)
  assessmentName: string;
  assessmentTypeId: string;    // UUID used in diagnose history API
  onBack: () => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reports, setReports] = useState<DiagnoseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<HistoryView>({ view: "list" });

  const Icon = getAssessmentIcon(assessmentName);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API_BASE}/api/health/assessment-types/${assessmentId}/sessions`, {
        credentials: "include",
      }).then((r) => r.json()),
      fetch(`${API_BASE}/api/health/diagnose/history/${assessmentTypeId}/`, {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([sessionsData, historyData]: [SessionsResponse, DiagnoseHistoryResponse]) => {
        setSessions(sessionsData.sessions || []);
        setReports(historyData.results || []);
      })
      .catch(() => setError("Failed to load history. Please try again."))
      .finally(() => setLoading(false));
  }, [assessmentId, assessmentTypeId]);

  // ── Detail view ──
  if (view.view === "detail") {
    const session = sessions.find((s) => s.session_id === view.report.session_id);
    return (
      <ReportDetailView
        report={view.report}
        session={session}
        onBack={() => setView({ view: "list" })}
      />
    );
  }

  // ── List view ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to assessment
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{assessmentName}</h1>
            <p className="text-slate-500 text-sm">Diagnosis history</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sessions", value: sessions.length, icon: ClipboardList },
          { label: "Diagnoses", value: reports.length, icon: FileText },
          {
            label: "Latest Risk",
            value: reports[0]?.risk_level ?? "—",
            icon: TrendingUp,
            colored: reports[0] ? getRiskStyle(reports[0].risk_level).color : "text-slate-500",
          },
        ].map(({ label, value, icon: StatIcon, colored }) => (
          <div key={label} className="bg-[#0f1318] border border-white/5 rounded-2xl p-4">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mb-2">
              <StatIcon className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className={`text-lg font-bold font-mono ${colored ?? "text-white"}`}>{value}</div>
            <div className="text-[11px] text-slate-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading history…</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      ) : reports.length === 0 ? (
        <EmptyHistory assessmentName={assessmentName} />
      ) : (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Past Diagnoses
          </p>
          <div className="space-y-3">
            {reports.map((report) => (
              <HistoryRow
                key={report.report_id}
                report={report}
                session={sessions.find((s) => s.session_id === report.session_id)}
                onClick={() => setView({ view: "detail", report })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}