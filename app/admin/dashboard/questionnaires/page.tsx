"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
  ClipboardList,
  X,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Type,
  Hash,
  ListChecks,
  Tag,
  FileText,
  Activity,
  Layers,
  BookOpen,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import {
  adminService,
  authService,
  questionnairesService,
  sectionService,
} from "@/services/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { init } from "next/dist/compiled/webpack/webpack";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerType = "text" | "number" | "mcq";

interface MCQOption {
  id: string;
  label: string;
}

interface Question {
  id: string;
  text: string;
  answerType: AnswerType;
  options: MCQOption[];
}

interface Section {
  reference_id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Questionnaire {
  id: string;
  title: string;
  sectionId: string;
  sectionName?: string;
  questions: Question[];
  createdAt: string;
  status: "active" | "draft";
}

// ─── Simulated API layer ──────────────────────────────────────────────────────

// In-memory store (replace with real API calls)
let _sections: Section[] = [];
let _questionnaires: Questionnaire[] = [];

const delay = (ms = 700) => new Promise((res) => setTimeout(res, ms));

const questionnairesAPI = {
  getAll: async (): Promise<Questionnaire[]> => {
    await delay(600);
    // Hydrate sectionName
    return JSON.parse(
      JSON.stringify(
        _questionnaires.map((q) => ({
          ...q,
          sectionName:
            _sections.find((s) => s.reference_id === q.sectionId)?.name ??
            "Unknown",
        })),
      ),
    );
  },
  create: async (
    payload: Omit<Questionnaire, "id" | "createdAt" | "sectionName">,
  ): Promise<Questionnaire> => {
    await delay();
    const q: Questionnaire = {
      ...payload,
      id: `q-${uid()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      sectionName: _sections.find((s) => s.reference_id === payload.sectionId)
        ?.name,
    };
    _questionnaires = [q, ..._questionnaires];
    return q;
  },
  update: async (
    id: string,
    payload: Omit<Questionnaire, "id" | "createdAt" | "sectionName">,
  ): Promise<Questionnaire> => {
    await delay();
    const updated: Questionnaire = {
      ...payload,
      id,
      createdAt: _questionnaires.find((q) => q.id === id)?.createdAt ?? "",
      sectionName: _sections.find((s) => s.reference_id === payload.sectionId)
        ?.name,
    };
    _questionnaires = _questionnaires.map((q) => (q.id === id ? updated : q));
    return updated;
  },
  delete: async (id: string): Promise<void> => {
    await delay(500);
    _questionnaires = _questionnaires.filter((q) => q.id !== id);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const answerTypeIcon = (t: AnswerType) =>
  ({
    text: <Type className="w-3.5 h-3.5" />,
    number: <Hash className="w-3.5 h-3.5" />,
    mcq: <ListChecks className="w-3.5 h-3.5" />,
  })[t];

const answerTypeLabel = (t: AnswerType) =>
  ({ text: "Text", number: "Number", mcq: "MCQ" })[t];

const SECTION_COLORS = [
  "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "bg-red-500/10 text-red-400 border-red-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
];

const getSectionColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return SECTION_COLORS[Math.abs(hash) % SECTION_COLORS.length];
};

// ─── Empty forms ──────────────────────────────────────────────────────────────

const emptyQuestion = (): Question => ({
  id: uid(),
  text: "",
  answerType: "text",
  options: [],
});

const emptyQuestionnaire = (sections: Section[]): Questionnaire => ({
  id: uid(),
  title: "",
  sectionId: sections[0]?.reference_id ?? "",
  questions: [emptyQuestion()],
  createdAt: new Date().toISOString().slice(0, 10),
  status: "active",
});

const emptySection = (): Omit<Section, "reference_id" | "created_at"> => ({
  name: "",
  description: "",
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBadge({
  sectionId,
  sectionName,
}: {
  sectionId: string;
  sectionName?: string;
}) {
  const cls = getSectionColor(sectionId);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${cls}`}
    >
      <Tag className="w-3 h-3" />
      {sectionName ?? "Unknown"}
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "draft" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
        status === "active"
          ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
          : "bg-slate-600/20 text-slate-500 border-slate-600/20"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-teal-400" : "bg-slate-500"}`}
      />
      {status === "active" ? "Active" : "Draft"}
    </span>
  );
}

function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

// ─── Section Form Modal ───────────────────────────────────────────────────────

function SectionFormModal({
  initial,
  onSave,
  onCancel,
}: {
  initial: Section | null;
  onSave: (s: Section) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<
    Omit<Section, "reference_id" | "created_at">
  >(
    initial
      ? { name: initial.name, description: initial.description }
      : emptySection(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Section name is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      let result: any;
      const payload = {
        name: form.name,
        description: form.description,
      };
      if (isEdit && initial) {
        result = await sectionService.update(initial.reference_id, payload); // result = await sectionsAPI.update(initial.reference_id, payload)
        console.log("Updated section:", result);
        toast.success("Section updated successfully");
      } else {
        result = await sectionService.create(payload);
        console.log("Created section:", result);
        toast.success("Section created successfully");
      }
      onSave(result.data);
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Failed to save section.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              {isEdit ? "Edit Section" : "New Section"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Update section details"
                : "Create a new questionnaire section"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Section Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Cardiovascular"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Brief description of this section's purpose..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 text-white text-sm font-semibold transition-all shadow-lg shadow-teal-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> {isEdit ? "Update" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  title,
  subtitle,
  onConfirm,
  onCancel,
}: {
  title: string;
  subtitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:bg-red-500/50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sections Manager Page ────────────────────────────────────────────────────

function SectionsPage({ onBack }: { onBack: () => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<Section | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sectionService.getAll();
      console.log(data);
      setSections(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading sections:", error);
      setSections([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (s: Section) => {
    load();
    setFormTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await sectionService.delete(deleteTarget.reference_id);
      setSections((prev) =>
        prev.filter((s) => s.reference_id !== deleteTarget.reference_id),
      );
      setDeleteTarget(null);
      toast.success("Section deleted successfully");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-slate-700" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-display">
            Assessment Types
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage different types of assessments
          </p>
        </div>
        <button
          onClick={() => setFormTarget("new")}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" /> New Assessment Type
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading sections..." />
      ) : sections.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <Layers className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No sections yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Create your first section to get started
          </p>
          <button
            onClick={() => setFormTarget("new")}
            className="mt-4 inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Create Assessment Type
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sections.map((section) => (
            <div
              key={section.reference_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getSectionColor(section.reference_id)}`}
                  >
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {section.name}
                    </h3>
                    {section.created_at && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {section.created_at}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setFormTarget(section)}
                    className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(section)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {section.description && (
                <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                  {section.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {formTarget && (
        <SectionFormModal
          initial={formTarget === "new" ? null : (formTarget as Section)}
          onSave={handleSave}
          onCancel={() => setFormTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          title="Delete section?"
          subtitle={`"${deleteTarget.name}" and all its questionnaires will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const addOption = () =>
    onChange({
      ...question,
      options: [...question.options, { id: uid(), label: "" }],
    });

  const updateOption = (oid: string, label: string) =>
    onChange({
      ...question,
      options: question.options.map((o) =>
        o.id === oid ? { ...o, label } : o,
      ),
    });

  const removeOption = (oid: string) =>
    onChange({
      ...question,
      options: question.options.filter((o) => o.id !== oid),
    });

  const setAnswerType = (t: AnswerType) =>
    onChange({
      ...question,
      answerType: t,
      options: t === "mcq" ? [{ id: uid(), label: "" }] : [],
    });

  return (
    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4 group relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20 shrink-0">
          <span className="text-xs font-bold text-teal-400 font-mono">
            {index + 1}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          Question {index + 1}
        </span>
        <div className="flex-1" />

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        type="text"
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        placeholder="Type your question here..."
        className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
      />

      <div className="flex gap-2">
        {(["text", "number", "mcq"] as AnswerType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setAnswerType(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              question.answerType === t
                ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
                : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
            }`}
          >
            {answerTypeIcon(t)}
            {answerTypeLabel(t)}
          </button>
        ))}
      </div>

      {question.answerType === "mcq" && (
        <div className="space-y-2 pl-2 border-l-2 border-teal-500/20">
          <p className="text-xs text-slate-500 font-medium mb-2">
            Answer options
          </p>
          {question.options.map((opt, oi) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0 flex items-center justify-center">
                <span className="text-[10px] text-slate-500 font-mono">
                  {String.fromCharCode(65 + oi)}
                </span>
              </div>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className="flex-1 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
              />
              {question.options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors mt-1 pl-7"
          >
            <Plus className="w-3.5 h-3.5" /> Add option
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Questionnaire Form ───────────────────────────────────────────────────────

function QuestionnaireForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Questionnaire | null;
  onSave: (q: Questionnaire, isEdit: boolean) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [form, setForm] = useState<Questionnaire | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      console.log("Initial data: ", initial);
      try {
        const data = await sectionService.getAll();
        const sections = data.data;

        setSections(sections);

        if (!form) {
          setForm(
            initial
              ? {
                  ...initial,
                  questions: initial.questions.map((q: any, index: number) => ({
                    id: q.id || `q-${index}`,
                    text: q.text || q.question_text || "",
                    answerType: q.answerType || q.input_type || "text",
                    options:
                      q.input_type === "mcq" || q.answerType === "mcq"
                        ? q.options?.map((opt: any, i: number) => ({
                            id: opt.option_id || `opt-${i}`,
                            label: opt.option_text || "",
                          })) || []
                        : [],
                  })),
                }
              : {
                  ...emptyQuestionnaire(data),
                  sectionId:
                    sections.length > 0 ? sections[0].reference_id : "",
                },
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSections(false);
      }
    };

    loadData();
  }, []);

  if (loadingSections || !form)
    return <LoadingSpinner label="Loading sections..." />;

  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <Layers className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No sections available</p>
          <p className="text-slate-600 text-sm mt-1">
            Please create at least one section before adding a questionnaire.
          </p>
          <button
            onClick={onCancel}
            className="mt-4 inline-flex items-center gap-2 border border-slate-700 text-slate-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            Go back and create a section
          </button>
        </div>
      </div>
    );
  }

  const setField = <K extends keyof Questionnaire>(
    key: K,
    val: Questionnaire[K],
  ) => setForm((prev) => (prev ? { ...prev, [key]: val } : prev));

  const addQuestion = () =>
    setForm((prev) =>
      prev
        ? { ...prev, questions: [...prev.questions, emptyQuestion()] }
        : prev,
    );

  const updateQuestion = (idx: number, q: Question) =>
    setForm((prev) => {
      if (!prev) return prev;
      const qs = [...prev.questions];
      qs[idx] = q;
      return { ...prev, questions: qs };
    });

  const removeQuestion = (idx: number) =>
    setForm((prev) =>
      prev
        ? { ...prev, questions: prev.questions.filter((_, i) => i !== idx) }
        : prev,
    );

  const validate = () => {
    if (!form.title.trim()) return "Questionnaire title is required.";
    if (!form.sectionId?.trim()) return "Please select a section.";
    for (const [i, q] of form.questions.entries()) {
      if (!q.text.trim()) return `Question ${i + 1} text is empty.`;
      if (q.answerType === "mcq") {
        if (q.options.length < 2)
          return `Question ${i + 1}: MCQ needs at least 2 options.`;
        if (q.options.some((o) => !o.label.trim()))
          return `Question ${i + 1}: All MCQ options must have text.`;
      }
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.title,
        assessment_type: form.sectionId,
        questions: form.questions.map((q) => ({
          question_text: q.text,
          input_type: q.answerType,
          ...(q.answerType === "mcq"
            ? { options: q.options.map((o) => o.label) }
            : {}),
        })),
      };
      const editPayload = {
        section_id: initial?.id,
        name: form.title,
        assessment_type: form.sectionId,
        questions: form.questions.map((q: any) => ({
          question_text: q.text,
          question_id: q.question_id,
          input_type: q.answerType,
          ...(q.answerType === "mcq"
            ? { options: q.options.map((o: any) => o.label) }
            : {}),
        })),
      };
      console.log("editPayload", editPayload);
      let result: any;

      if (isEdit && initial) {
        result = await questionnairesService.update(editPayload);
        toast.success("Questionnaire updated successfully");
      } else {
        result = await questionnairesService.create(payload);
        toast.success("Questionnaire created successfully");
      }
      onSave(
        {
          id: isEdit ? initial!.id : result.data.id,
          title: form.title,
          sectionId: form.sectionId,
          sectionName: form.sectionName || "",
          status: form.status,
          createdAt: form.createdAt || "-",
          questions: form.questions,
        },
        isEdit,
      );
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error(`Failed to ${isEdit ? "update" : "create"} questionnaire.`);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-slate-700" />
        <div>
          <h1 className="text-xl font-bold text-white font-display">
            {isEdit ? "Edit Questionnaire" : "New Questionnaire"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEdit
              ? `Editing: ${initial?.title}`
              : "Build a new patient questionnaire"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" /> Questionnaire Details
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Cardiovascular Risk Screener"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Section <span className="text-red-400">*</span>
              </label>
              <select
                value={form.sectionId}
                onChange={(e) => setField("sectionId", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all appearance-none cursor-pointer"
              >
                {sections.map((s) => (
                  <option key={s.reference_id} value={s.reference_id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {/* Section description hint */}
              {form.sectionId && (
                <p className="text-xs text-slate-600 mt-1">
                  {
                    sections.find((s) => s.reference_id === form.sectionId)
                      ?.description
                  }
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Status
            </label>
            <div className="flex gap-3">
              {(["active", "draft"] as const).map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={form.status === s}
                    onChange={() => setField("status", s)}
                    className="accent-teal-500"
                  />
                  <span className="text-sm text-slate-300 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-teal-400" />
            Questions
            <span className="text-xs font-normal text-slate-500">
              ({form.questions.length})
            </span>
          </h2>

          <div className="space-y-3">
            {form.questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={i}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
                canRemove={form.questions.length > 1}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-500 hover:border-teal-500/40 hover:text-teal-400 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 text-white text-sm font-semibold transition-all shadow-lg shadow-teal-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> {isEdit ? "Update" : "Create"}{" "}
                Questionnaire
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ q, onClose }: { q: Questionnaire; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  console.log("View Rendering", q);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SectionBadge
                sectionId={q.sectionId}
                sectionName={q.sectionName}
              />
              <StatusBadge status={q.status} />
            </div>
            <h2 className="text-lg font-bold text-white font-display">
              {q.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
            {q.questions.length} Questions
          </p>
          {q.questions.map((question: any, i) => {
  // Normalize both API shape and local shape
  const questionId = question.question_id || question.id;
  const questionText = question.question_text || question.text;
  const inputType = question.input_type || question.answerType;
  const options = question.options?.map((o: any) => ({
    option_id: o.option_id || o.id,
    option_text: o.option_text || o.label,
  })) || [];

  return (
    <div
      key={questionId}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800 transition-colors"
        onClick={() =>
          setExpanded(expanded === questionId ? null : questionId)
        }
      >
        <span className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xs font-bold text-teal-400 font-mono shrink-0">
          {i + 1}
        </span>
        <span className="flex-1 text-sm text-white">{questionText}</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
            {answerTypeIcon(inputType)}
            {answerTypeLabel(inputType)}
          </span>
          {expanded === questionId ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {expanded === questionId && inputType === "mcq" && (
        <div className="px-4 pb-4 space-y-1.5 border-t border-slate-700/50 pt-3">
          {options.map((o: any, oi: number) => (
            <div
              key={o.option_id}
              className="flex items-center gap-2 text-sm text-slate-400"
            >
              <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-mono text-slate-500">
                {String.fromCharCode(65 + oi)}
              </span>
              {o.option_text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
})}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <p className="text-xs text-slate-600 text-center">
            Created {q.createdAt} · ID: {q.id}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section Group Component ──────────────────────────────────────────────────

function SectionGroup({
  section,
  questionnaires,
  onView,
  onEdit,
  onDelete,
}: {
  section: Section;
  questionnaires: Questionnaire[];
  onView: (q: Questionnaire) => void;
  onEdit: (q: Questionnaire) => void;
  onDelete: (q: Questionnaire) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all group"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getSectionColor(section.reference_id)}`}
        >
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-semibold text-white text-sm">{section.name}</h3>
          {section.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {section.description}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-500 bg-slate-800/50 px-2.5 py-1 rounded-lg font-mono">
          {questionnaires.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="grid gap-3 pl-2">
          {questionnaires.map((q) => (
            <div
              key={q.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white text-sm truncate">
                      {q.title}
                    </h4>
                    <StatusBadge status={q.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {q.questions.length}{" "}
                    {q.questions.length === 1 ? "question" : "questions"}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onView(q)}
                    className="p-2 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(q)}
                    className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(q)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type View = "list" | "add" | "edit" | "sections";

export default function QuestionnairesAdminPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Questionnaire | null>(null);
  const [viewTarget, setViewTarget] = useState<Questionnaire | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Questionnaire | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft">(
    "all",
  );
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sectionService.getAll();
      setSections(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading sections:", error);
      setSections([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadQuestionnaires = useCallback(async () => {
    try {
      setLoading(true);

      // ALL
      if (sectionFilter === "all") {
        const data = await questionnairesService.getAll();
        console.log("Loaded questionnaires:", data);
        const mapped: Questionnaire[] =
          data?.data?.flatMap(
            (assessment: any) =>
              assessment.sections?.map((item: any) => ({
                id: item.section_id,
                title: item.name,
                sectionId: assessment.assessment_type_id,
                sectionName: assessment.name,
                status: "active",
                createdAt: "-",
                questions: item.questions || [],
              })) || [],
          ) || [];

        setQuestionnaires(mapped);
      } else {
        // BY ASSESSMENT TYPE ID
        const res = await questionnairesService.get(sectionFilter);

        const mapped: Questionnaire[] =
          res?.data?.sections?.map((item: any) => ({
            id: item.section_id,
            title: item.name,
            sectionId: res.data.assessment_type_id,
            sectionName: res.data.name,
            status: "active",
            createdAt: "-",
            questions: item.questions || [],
          })) || [];

        setQuestionnaires(mapped);
      }
    } catch (error) {
      console.error(error);
      setQuestionnaires([]);
    } finally {
      setLoading(false);
    }
  }, [sectionFilter]);

  useEffect(() => {
    loadQuestionnaires();
  }, [loadQuestionnaires]);

  const filtered = questionnaires.filter((q) => {
    const matchSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.sectionName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = (q: Questionnaire, isEdit: boolean) => {
    setQuestionnaires((prev) =>
      isEdit ? prev.map((d) => (d.id === q.id ? q : d)) : [q, ...prev],
    );
    setView("list");
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      console.log(
        "Deleting questionnaire with section ID:",
        deleteTarget.sectionId,
      );
      await questionnairesService.delete(deleteTarget.id);
      setQuestionnaires((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success("Questionnaire deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      toast.error("Failed to delete questionnaire. Please try again.");
    }
  };

  // Subpages
  if (view === "sections") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <SectionsPage
            onBack={() => {
              setView("list");
              loadQuestionnaires();
            }}
          />
        </div>
      </div>
    );
  }

  if (view === "add" || view === "edit") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <QuestionnaireForm
            initial={view === "edit" ? editTarget : null}
            onSave={handleSave}
            onCancel={() => {
              setView("list");
              setEditTarget(null);
            }}
          />
        </div>
      </div>
    );
  }

  const activeCount = questionnaires.filter(
    (q) => q.status === "active",
  ).length;
  const draftCount = questionnaires.filter((q) => q.status === "draft").length;
  const uniqueSections = [...new Set(questionnaires.map((q) => q.sectionId))]
    .length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 group mr-2"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-sm font-bold text-white hidden sm:block">
              MedPredict<span className="text-teal-400">AI</span>
            </span>
          </Link>
          <div className="w-px h-5 bg-slate-800" />
          <ClipboardList className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold text-white">
            Questionnaire Manager
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setView("sections")}
            className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <Layers className="w-4 h-4" /> Manage Assessment Types
          </button>
          <button
            onClick={() => setView("add")}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> New Questionnaire
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total",
              value: questionnaires.length,
              color: "text-white",
            },
            { label: "Active", value: activeCount, color: "text-teal-400" },
            { label: "Draft", value: draftCount, color: "text-slate-400" },
            {
              label: "Sections",
              value: uniqueSections,
              color: "text-violet-400",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div className={`text-2xl font-bold font-mono mb-0.5 ${c.color}`}>
                {c.value}
              </div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
            />
          </div>

          <div className="flex gap-4 items-center  ">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All</option>
              {sections.map((s) => (
                <option key={s.reference_id} value={s.reference_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(["all", "active", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterStatus === s
                    ? "bg-teal-500/20 text-teal-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner label="Loading questionnaires..." />
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              {questionnaires.length === 0
                ? "No questionnaires yet"
                : "No questionnaires found"}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              {questionnaires.length === 0
                ? "Create your first questionnaire to get started"
                : "Try adjusting your search or filters"}
            </p>
            {questionnaires.length === 0 && (
              <button
                onClick={() => setView("add")}
                className="mt-4 inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> New Questionnaire
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 border-b border-slate-800 bg-slate-800/30">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Title
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Questions
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Status
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden md:block">
                Created
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Actions
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {filtered.map((q) => {
                console.log("Rendering ", q);
                return (
                  <div
                    key={q.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-white text-sm truncate">
                          {q.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SectionBadge
                          sectionId={q.sectionId}
                          sectionName={q.sectionName}
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-sm font-mono font-bold text-white">
                        {q.questions.length}
                      </span>
                      <p className="text-xs text-slate-600">questions</p>
                    </div>

                    <div>
                      <StatusBadge status={q.status} />
                    </div>

                    <div className="hidden md:block">
                      <span className="text-xs text-slate-500">
                        {q.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewTarget(q)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditTarget(q);
                          setView("edit");
                        }}
                        className="p-2 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {viewTarget && (
        <ViewModal q={viewTarget} onClose={() => setViewTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirm
          title="Delete questionnaire?"
          subtitle={`"${deleteTarget.title}" and all its questions will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
