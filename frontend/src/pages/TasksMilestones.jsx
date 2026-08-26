import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiFetch, MAX_UPLOAD_SIZE_MB, openAsset, uploadFile } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const statusMeta = {
  todo: {
    label: "Planned",
    icon: "list_alt",
    tone: "bg-slate-100 text-slate-700 dark:bg-surface-container dark:text-on-surface",
  },
  in_progress: {
    label: "In progress",
    icon: "play_circle",
    tone: "bg-indigo-50 text-indigo-700 dark:bg-primary/15 dark:text-primary",
  },
  blocked: {
    label: "Blocked",
    icon: "block",
    tone: "bg-red-50 text-red-700 dark:bg-error/15 dark:text-error",
  },
  review: {
    label: "Awaiting supervisor review",
    icon: "rate_review",
    tone: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  },
  revision: {
    label: "Revision",
    icon: "edit_note",
    tone: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-200",
  },
  done: {
    label: "Complete",
    icon: "task_alt",
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  cancelled: {
    label: "Cancelled",
    icon: "cancel",
    tone: "bg-slate-100 text-slate-500 dark:bg-surface-container dark:text-secondary",
  },
};

const priorityMeta = {
  critical: "bg-red-100 text-red-700 dark:bg-error/20 dark:text-error",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  low: "bg-slate-100 text-slate-600 dark:bg-surface-container dark:text-secondary",
};

const normalizeStatus = (status) =>
  status === "completed" ? "done" : status === "delayed" ? "todo" : status;
const completed = (task) => ["done", "completed"].includes(task.status);
const dateOnly = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No date";
const overdue = (task) =>
  Boolean(
    task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      !completed(task) &&
      task.status !== "cancelled",
  );

const emptyTask = {
  title: "",
  description: "",
  acceptanceCriteria: "",
  priority: "medium",
  dueDate: "",
  dependencies: [],
  assignedTo: "",
  milestone: "",
  phase: "",
  requiredDeliverable: "",
};
const emptyDeliverable = { title: "", note: "", link: "", file: null, submissionId: "" };
const primaryActionClass =
  "inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryActionClass =
  "inline-flex items-center justify-center rounded-lg border border-outline-variant/50 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50";
const fieldLabelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wide text-secondary";
const fieldInputClass =
  "w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const TasksMilestones = () => {
  const { activeProject, setActiveProject, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyTask);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [reviewTask, setReviewTask] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewProgress, setReviewProgress] = useState("");
  const [deliverable, setDeliverable] = useState(emptyDeliverable);

  const projectId = activeProject?._id;
  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [response, submissionResponse] = await Promise.all([
        apiFetch(`/api/tasks?project=${projectId}`),
        apiFetch(`/api/submissions?project=${projectId}`).catch(() => ({
          data: [],
        })),
      ]);
      setTasks(response.data || []);
      setSubmissions(submissionResponse.data || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load project tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setError("");
    if (projectId) loadTasks();
    else {
      setTasks([]);
      setLoading(false);
    }
  }, [projectId, loadTasks]);

  const taskById = useMemo(
    () => new Map(tasks.map((task) => [String(task._id), task])),
    [tasks],
  );
  const dependencyNames = (task) =>
    (task.dependencies || []).map(
      (dependency) =>
        taskById.get(String(dependency))?.title || "Unavailable task",
    );
  const waitingOnDependencies = (task) =>
    (task.dependencies || []).some(
      (dependency) => !completed(taskById.get(String(dependency)) || {}),
    );
  const actionableTasks = tasks.filter(
    (task) => !completed(task) && task.status !== "cancelled",
  );
  const doneTasks = tasks.filter(completed);
  const blockedTasks = tasks.filter((task) => task.status === "blocked");
  const reviewTasks = tasks.filter((task) => task.status === "review");
  const overdueTasks = tasks.filter(overdue);
  const eligibleTasks = tasks.filter((task) => task.status !== "cancelled");
  const progress = eligibleTasks.length
    ? Math.round((doneTasks.length / eligibleTasks.length) * 100)
    : 0;

  const nextTask = [...actionableTasks].sort((a, b) => {
    const score = (task) =>
      task.status === "blocked"
        ? 0
        : overdue(task)
          ? 1
          : waitingOnDependencies(task)
            ? 4
            : task.status === "review"
              ? 2
              : task.priority === "critical"
                ? 1.5
                : task.priority === "high"
                  ? 2
                  : 3;
    const difference = score(a) - score(b);
    if (difference) return difference;
    return (
      new Date(a.dueDate || "9999-12-31") - new Date(b.dueDate || "9999-12-31")
    );
  })[0];

  const createTask = async (event) => {
    event.preventDefault();
    if (!activeProject?._id || saving) return;
    setError("");
    const title = draft.title.trim();
    const acceptanceCriteria = draft.acceptanceCriteria.trim();
    if (!title || !acceptanceCriteria) {
      setError("A task needs both a clear title and an expected outcome.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        title,
        acceptanceCriteria,
        description: draft.description.trim(),
        project: activeProject._id,
      };
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.assignedTo) delete payload.assignedTo;
      const response = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTasks((current) => [...current, response.data]);
      setDraft(emptyTask);
      setShowCreate(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to create the task.");
    } finally {
      setSaving(false);
    }
  };

  const transition = async (task, status) => {
    if (updatingId) return;
    let blockedReason = "";
    if (status === "blocked") {
      blockedReason =
        window
          .prompt(
            "What is blocking this work? This is required so the next person knows how to help.",
          )
          ?.trim() || "";
      if (!blockedReason) return;
    }
    setError("");
    setUpdatingId(task._id);
    try {
      const response = await apiFetch(`/api/tasks/${task._id}/transition`, {
        method: "POST",
        body: JSON.stringify({ status, blockedReason }),
      });
      setTasks((current) =>
        current.map((item) => (item._id === task._id ? response.data : item)),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to update this task.");
    } finally {
      setUpdatingId("");
    }
  };

  const requestReview = async (task) => {
    if (!activeProject?.supervisor) {
      setError(
        "Connect an active supervisor before requesting review. Your work remains safe.",
      );
      return;
    }
    setDeliverable({
      ...emptyDeliverable,
      title: `${task.title} — completion evidence`,
      submissionId: "",
    });
    setReviewError("");
    setReviewProgress("");
    setReviewTask(task);
  };

  const submitForReview = async (event) => {
    event.preventDefault();
    if (!reviewTask || saving) return;
    setSaving(true);
    setReviewError("");
    setReviewProgress("Preparing submission…");
    try {
      let submissionId = deliverable.submissionId;
      if (!submissionId) {
        let fileUrl = deliverable.link.trim();
        if (deliverable.file) {
          setReviewProgress("Uploading supporting file…");
          fileUrl = (await uploadFile(deliverable.file)).fileUrl;
        }
        if (!fileUrl && !deliverable.note.trim()) throw new Error("Attach a file, add an HTTPS link, or explain the completed work.");
        setReviewProgress("Saving deliverable…");
        const created = await apiFetch("/api/submissions", {
          method: "POST",
          body: JSON.stringify({
            title: deliverable.title.trim() || `${reviewTask.title} — completion evidence`,
            project: activeProject._id,
            task: reviewTask._id,
            fileUrl,
            content: deliverable.note.trim(),
          }),
        });
        submissionId = created.data._id;
        // If the final review request fails, keep the saved draft selected so
        // retrying does not create duplicate submissions.
        setDeliverable((current) => ({ ...current, submissionId }));
        setSubmissions((current) => [created.data, ...current]);
      }
      setReviewProgress("Sending to supervisor…");
      const response = await apiFetch(`/api/tasks/${reviewTask._id}/request-review`, {
        method: "POST",
        body: JSON.stringify({ submissionId, note: deliverable.note.trim() }),
      });
      setTasks((current) => current.map((item) => item._id === reviewTask._id ? response.data : item));
      setReviewTask(null);
      setDeliverable(emptyDeliverable);
      setNotice(`“${reviewTask.title}” was submitted to the supervisor for review.`);
    } catch (requestError) {
      setReviewError(requestError.message || "Unable to submit this task for review.");
    } finally {
      setSaving(false);
      setReviewProgress("");
    }
  };

  const decideReview = async (task, decision) => {
    const feedback =
      window
        .prompt(
          decision === "approve"
            ? "Optional feedback for the student:"
            : "What must the student revise?",
        )
        ?.trim() || "";
    if (decision === "revision" && !feedback) return;
    setUpdatingId(task._id);
    setError("");
    try {
      const response = await apiFetch(
        `/api/tasks/${task._id}/review-decision`,
        { method: "POST", body: JSON.stringify({ decision, feedback }) },
      );
      setTasks((current) =>
        current.map((item) => (item._id === task._id ? response.data : item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId("");
    }
  };

  const withdrawReview = async (task) => {
    if (updatingId) return;
    setUpdatingId(task._id);
    setError("");
    try {
      const response = await apiFetch(
        `/api/tasks/${task._id}/withdraw-review`,
        {
          method: "POST",
          body: JSON.stringify({
            note: "Review withdrawn to update the linked deliverable.",
          }),
        },
      );
      setTasks((current) =>
        current.map((item) => (item._id === task._id ? response.data : item)),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to withdraw this review.");
    } finally {
      setUpdatingId("");
    }
  };

  const decideSuggestion = async (task, decision) => {
    setUpdatingId(task._id);
    setError("");
    try {
      const response = await apiFetch(`/api/tasks/${task._id}/suggestion-decision`, {
        method: "POST",
        body: JSON.stringify({ decision, assignedTo: task.createdBy?._id || task.createdBy }),
      });
      setTasks((current) => current.map((item) => item._id === task._id ? response.data : item));
    } catch (requestError) {
      setError(requestError.message || "Unable to decide this suggestion.");
    } finally {
      setUpdatingId("");
    }
  };

  const addComment = async (task, instruction = false) => {
    const body = window.prompt(instruction ? "Add a clear supervisor instruction:" : "Add a task comment:")?.trim();
    if (!body) return;
    setUpdatingId(task._id);
    try {
      const response = await apiFetch(`/api/tasks/${task._id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, kind: instruction ? "supervisor_instruction" : "comment" }),
      });
      setTasks((current) => current.map((item) => item._id === task._id ? response.data : item));
    } catch (requestError) {
      setError(requestError.message || "Unable to add the comment.");
    } finally {
      setUpdatingId("");
    }
  };

  const createMilestone = async () => {
    const title = window.prompt("Milestone title")?.trim();
    if (!title) return;
    try {
      const response = await apiFetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      if (response.project) setActiveProject(response.project);
    } catch (requestError) {
      setError(requestError.message || "Unable to create the milestone.");
    }
  };

  const members = activeProject?.students || [];
  const currentUserId = String(user?._id || user?.id || "");
  const leaderId = String(
    activeProject?.leaderUserId?._id ||
      activeProject?.leaderUserId ||
      activeProject?.students?.[0]?._id ||
      activeProject?.students?.[0] ||
      "",
  );
  const canCreateTask =
    user?.role === "admin" ||
    user?.role === "supervisor" ||
    currentUserId === leaderId;
  const canProposeTask = activeProject?.status !== "archived" && (
    canCreateTask || members.some((member) => String(member?._id || member) === currentUserId)
  );
  const canMoveTask = (task) => {
    const status = normalizeStatus(task.status);
    if (["supervisor", "admin"].includes(user?.role)) return status === "review";
    return user?.role === "student" &&
      status !== "review" &&
      String(task.assignedTo?._id || task.assignedTo || "") === currentUserId;
  };
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "assigned") return String(task.assignedTo?._id || task.assignedTo || "") === currentUserId;
    if (taskFilter === "created") return String(task.createdBy?._id || task.createdBy || "") === currentUserId;
    return true;
  });
  const columns = [
    {
      id: "todo",
      label: "Planned",
      helper: "Ready work and prerequisites",
      tasks: filteredTasks.filter((task) => normalizeStatus(task.status) === "todo"),
    },
    {
      id: "in_progress",
      label: "In progress",
      helper: "Active work with a defined outcome",
      tasks: filteredTasks.filter(
        (task) => normalizeStatus(task.status) === "in_progress",
      ),
    },
    {
      id: "review",
      label: "Review & revisions",
      helper: "Submitted work and requested changes",
      tasks: filteredTasks.filter((task) =>
        ["review", "revision", "blocked"].includes(normalizeStatus(task.status)),
      ),
    },
    {
      id: "done",
      label: "Completed",
      helper: "Accepted outcomes",
      tasks: filteredTasks.filter((task) => completed(task)),
    },
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const task = tasks.find((t) => String(t._id) === draggableId);
    if (!task) return;

    const fromCol = source.droppableId;
    const toCol = destination.droppableId;
    const status = normalizeStatus(task.status);
    const isSupervisor = ["supervisor", "admin"].includes(user?.role);

    if (fromCol === "todo" && toCol === "in_progress") {
      transition(task, "in_progress");
    } else if (fromCol === "in_progress" && toCol === "review") {
      requestReview(task);
    } else if (fromCol === "review" && toCol === "in_progress") {
      if (status === "review" && isSupervisor) decideReview(task, "revision");
      else if (status === "review" && !isSupervisor) withdrawReview(task);
      else transition(task, "in_progress"); 
    } else if (fromCol === "review" && toCol === "done") {
      if (status === "review" && isSupervisor) decideReview(task, "approve");
      else setError("Only a supervisor can approve a task.");
    } else {
      setError(`Cannot move task from ${fromCol} to ${toCol} directly. Please use the action buttons.`);
    }
  };

  if (!activeProject)
    return (
      <div className="grid min-h-[70vh] place-items-center bg-background p-6">
        <div className="max-w-md rounded-3xl border border-outline-variant/30 bg-surface p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-secondary">
            folder_off
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-on-surface">
            Choose a project first
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Tasks are always connected to a project, its people, and its
            deliverables. Select a project from the top navigation to continue.
          </p>
        </div>
      </div>
    );

  const taskActions = (task) => {
    const status = normalizeStatus(task.status);
    const waiting = waitingOnDependencies(task);
    const isSupervisor = ["supervisor", "admin"].includes(user?.role);
    const isAssignedStudent = user?.role === "student" &&
      String(task.assignedTo?._id || task.assignedTo || "") === currentUserId;
    if (task.kind === "suggestion" && task.suggestionState === "pending") {
      return canCreateTask ? (
        <div className="flex gap-2">
          <button onClick={() => decideSuggestion(task, "accept")} className={primaryActionClass}>Accept suggestion</button>
          <button onClick={() => decideSuggestion(task, "reject")} className={secondaryActionClass}>Decline</button>
        </div>
      ) : <span className="text-xs font-semibold text-amber-700 dark:text-amber-200">Awaiting leader or supervisor decision</span>;
    }
    if (status === "todo")
      return isAssignedStudent ? (
        <button
          disabled={waiting || Boolean(updatingId)}
          onClick={() => transition(task, "in_progress")}
          className={primaryActionClass}
        >
          {waiting ? "Waiting for prerequisite" : "Start task"}
        </button>
      ) : (
        <span className="text-xs font-semibold text-secondary">
          {isSupervisor ? "Waiting for the assigned student to start" : "Assigned to another student"}
        </span>
      );
    if (status === "in_progress")
      return isAssignedStudent ? (
        <div className="flex gap-2">
          <button
            disabled={Boolean(updatingId)}
            onClick={() => requestReview(task)}
            className={primaryActionClass}
          >
            Submit completed work
          </button>
          <button
            disabled={Boolean(updatingId)}
            onClick={() => transition(task, "blocked")}
            className={secondaryActionClass}
          >
            Block
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold text-secondary">
          {isSupervisor ? "Student work in progress — review opens after submission" : "In progress by the assignee"}
        </span>
      );
    if (status === "blocked")
      return isAssignedStudent ? (
        <button
          disabled={Boolean(updatingId)}
          onClick={() => transition(task, "in_progress")}
          className={primaryActionClass}
        >
          Resume task
        </button>
      ) : (
        <span className="text-xs font-semibold text-error">
          {isSupervisor ? "Blocked — add an instruction or comment" : "Blocked by the assignee"}
        </span>
      );
    if (status === "revision")
      return isAssignedStudent ? (
        <button disabled={Boolean(updatingId)} onClick={() => transition(task, "in_progress")} className={primaryActionClass}>
          Start revision
        </button>
      ) : (
        <span className="text-xs font-semibold text-secondary">
          {isSupervisor ? "Revision returned to the student" : "Revision assigned to another student"}
        </span>
      );
    if (status === "review")
      return isSupervisor ? (
        <div className="flex gap-2">
          <button
            disabled={Boolean(updatingId) || waiting}
            onClick={() => decideReview(task, "approve")}
            className={primaryActionClass}
          >
            Approve deliverable
          </button>
          <button
            disabled={Boolean(updatingId)}
            onClick={() => decideReview(task, "revision")}
            className={secondaryActionClass}
          >
            Request revision
          </button>
        </div>
      ) : String(task.assignedTo?._id || task.assignedTo || "") ===
        currentUserId ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-200">
            Awaiting supervisor decision
          </span>
          <button
            disabled={Boolean(updatingId)}
            onClick={() => withdrawReview(task)}
            className={secondaryActionClass}
          >
            Withdraw review
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold text-secondary">
          Supervisor review in progress
        </span>
      );
    return (
      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        Outcome accepted
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-[1700px]">
        <header className="flex flex-col justify-between gap-4 border-b border-outline-variant/30 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
              Project execution
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface">
              Tasks & milestones
            </h1>
            <p className="mt-2 text-sm text-secondary">
              <span className="font-bold text-on-surface">
                {activeProject.title}
              </span>{" "}
              · every task should produce a verifiable project outcome.
            </p>
          </div>
          {canProposeTask && (
            <button
              onClick={() => {
                setError("");
                setShowCreate(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-sm hover:brightness-95"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_task
              </span>
              {canCreateTask ? "New official task" : "Propose a task"}
            </button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error"
          >
            <span className="material-symbols-outlined text-[19px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} className="font-bold" aria-label="Dismiss notification">×</button>
          </div>
        )}

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_repeat(3,minmax(0,.65fr))]">
          <article className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Next logical action
            </p>
            {nextTask ? (
              <>
                <h2 className="mt-2 text-lg font-extrabold text-on-surface">
                  {nextTask.title}
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  {nextTask.status === "blocked"
                    ? `Blocked: ${nextTask.blockedReason || "needs clarification"}`
                    : overdue(nextTask)
                      ? `Overdue since ${dateOnly(nextTask.dueDate)}`
                      : waitingOnDependencies(nextTask)
                        ? `Waiting for: ${dependencyNames(nextTask).join(", ")}`
                        : `Expected outcome: ${nextTask.acceptanceCriteria || "Define the outcome before starting."}`}
                </p>
                <div className="mt-4">{taskActions(nextTask)}</div>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-lg font-extrabold text-on-surface">
                  No open work
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  Create the next deliverable when the project is ready to move
                  forward.
                </p>
              </>
            )}
          </article>
          {[
            ["task_alt", `${progress}%`, "Accepted progress"],
            [
              "priority_high",
              `${overdueTasks.length + blockedTasks.length}`,
              "Needs attention",
            ],
            ["rate_review", reviewTasks.length, "Awaiting supervisor review"],
          ].map(([icon, value, label]) => (
            <article
              key={label}
              className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-sm"
            >
              <span className="material-symbols-outlined text-primary">
                {icon}
              </span>
              <p className="mt-3 text-2xl font-extrabold text-on-surface">
                {loading ? "—" : value}
              </p>
              <p className="mt-1 text-sm text-secondary">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-4 grid gap-3 rounded-2xl border border-outline-variant/30 bg-surface p-4 text-sm md:grid-cols-3">
          <div><p className="font-extrabold text-on-surface">Student workflow</p><p className="mt-1 text-secondary">Start assigned work, attach evidence, then submit it for review.</p></div>
          <div><p className="font-extrabold text-on-surface">Supervisor workflow</p><p className="mt-1 text-secondary">Assign official tasks, review submitted evidence, accept it or request revisions.</p></div>
          <div><p className="font-extrabold text-on-surface">Completion rule</p><p className="mt-1 text-secondary">A student cannot mark work finished. Only supervisor acceptance moves it to Completed.</p></div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Task filters">
            {[["all", "All project tasks"], ["assigned", "Assigned to me"], ["created", "Created by me"]].map(([value, label]) => (
              <button key={value} onClick={() => setTaskFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${taskFilter === value ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"}`}>{label}</button>
            ))}
          </div>
          {canCreateTask && <button onClick={createMilestone} className={secondaryActionClass}><span className="material-symbols-outlined mr-1 text-base">flag</span>New milestone</button>}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <section className="mt-4 grid gap-4 xl:grid-cols-4">
            {columns.map((column) => (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided, snapshot) => (
                  <section
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[360px] rounded-2xl border ${
                      snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-surface-container-low"
                    } p-3 transition-colors duration-200`}
                  >
                    <header className="mb-3 flex items-start justify-between gap-3 px-2 pt-2">
                      <div>
                        <h2 className="font-bold text-on-surface">{column.label}</h2>
                        <p className="mt-1 text-xs text-secondary">{column.helper}</p>
                      </div>
                      <span className="rounded-full bg-surface px-2 py-1 text-xs font-bold text-secondary">
                        {column.tasks.length}
                      </span>
                    </header>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="rounded-xl bg-surface p-4 text-sm text-secondary">
                          Loading tasks…
                        </div>
                      ) : (
                        column.tasks.map((task, index) => {
                          const status = normalizeStatus(task.status);
                          const meta = statusMeta[status] || statusMeta.todo;
                          const waiting = waitingOnDependencies(task);
                          return (
                            <Draggable draggableId={String(task._id)} index={index} key={task._id} isDragDisabled={!canMoveTask(task)}>
                              {(provided, snapshot) => (
                                <article
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`rounded-xl border ${
                                    snapshot.isDragging ? "border-primary bg-surface shadow-xl ring-2 ring-primary/20" : "border-outline-variant/25 bg-surface shadow-sm"
                                  } p-4 transition-all duration-200`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span
                                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.tone}`}
                                    >
                                      {meta.label}
                                    </span>
                                    <span
                                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${priorityMeta[task.priority || "medium"]}`}
                                    >
                                      {task.priority || "medium"}
                                    </span>
                                  </div>
                                  <h3 className="mt-3 text-sm font-extrabold leading-snug text-on-surface">
                                    {task.title}
                                  </h3>
                                  <p className="mt-1 text-xs text-secondary">Owner: {task.assignedTo?.name || "Unassigned"}</p>
                                  {task.kind === "suggestion" && task.suggestionState === "pending" && <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-200">Task suggestion · not yet official</p>}
                                  {(task.phase || task.milestone) && <p className="mt-2 text-xs font-semibold text-primary">{task.phase || "Milestone-linked work"}</p>}
                                  {task.description && (
                                    <p className="mt-2 text-xs leading-relaxed text-secondary">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="mt-3 rounded-lg bg-surface-container-low px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-secondary">
                                      Expected outcome
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-on-surface">
                                      {task.acceptanceCriteria ||
                                        "No outcome defined yet."}
                                    </p>
                                  </div>
                                  {(task.dependencies || []).length > 0 && (
                                    <p
                                      className={`mt-3 text-xs ${waiting ? "text-amber-700 dark:text-amber-200" : "text-secondary"}`}
                                    >
                                      <span className="material-symbols-outlined mr-1 align-[-3px] text-[15px]">
                                        account_tree
                                      </span>
                                      {waiting
                                        ? "Waiting for: "
                                        : "Prerequisite complete: "}
                                      {dependencyNames(task).join(", ")}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <p
                                      className={`mt-3 text-xs font-semibold ${overdue(task) ? "text-error" : "text-secondary"}`}
                                    >
                                      <span className="material-symbols-outlined mr-1 align-[-3px] text-[15px]">
                                        event
                                      </span>
                                      {overdue(task) ? "Overdue · " : "Due · "}
                                      {dateOnly(task.dueDate)}
                                    </p>
                                  )}
                                  {task.status === "blocked" && (
                                    <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
                                      Blocker: {task.blockedReason}
                                    </p>
                                  )}
                                  {(task.evidence || []).length > 0 && (
                                    <div className="mt-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3">
                                      <p className="text-[10px] font-bold uppercase tracking-wide text-secondary">Evidence</p>
                                      {(task.evidence || []).map((item, evidenceIndex) => (
                                        <div key={item._id || evidenceIndex} className="mt-2 text-xs text-on-surface">
                                          <span className="font-semibold">{item.name || "Task evidence"}</span>
                                          {item.fileUrl && <button type="button" onClick={() => openAsset(item.fileUrl).catch((requestError) => setError(requestError.message))} className="ml-2 font-bold text-primary hover:underline">Open</button>}
                                          {item.note && <p className="mt-1 line-clamp-3 text-secondary">{item.note}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mt-4">
                                    {updatingId === task._id ? (
                                      <span className="text-xs font-semibold text-secondary">
                                        Updating…
                                      </span>
                                    ) : (
                                      taskActions(task)
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant/25 pt-3">
                                    <button onClick={() => addComment(task)} className="text-xs font-bold text-primary hover:underline">Comment ({task.comments?.length || 0})</button>
                                    {["supervisor", "admin"].includes(user?.role) && <button onClick={() => addComment(task, true)} className="text-xs font-bold text-secondary hover:text-primary">Add instruction</button>}
                                  </div>
                                </article>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                      {!loading && column.tasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-outline-variant/40 p-5 text-center text-xs leading-relaxed text-secondary">
                          No {column.label.toLowerCase()} tasks.
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </Droppable>
            ))}
          </section>
        </DragDropContext>

        {reviewTask && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <form onSubmit={submitForReview} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-outline-variant/30 bg-surface shadow-2xl">
              <header className="flex items-start justify-between gap-4 border-b border-outline-variant/30 p-6">
                <div><p className="text-xs font-bold uppercase tracking-wide text-primary">Submit completed work</p><h2 className="mt-1 text-xl font-extrabold text-on-surface">{reviewTask.title}</h2><p className="mt-1 text-sm text-secondary">Attach evidence now. The supervisor can review only after you submit this form.</p></div>
                <button type="button" onClick={() => setReviewTask(null)} className="rounded-lg p-2 text-secondary hover:bg-surface-container"><span className="material-symbols-outlined">close</span></button>
              </header>
              <div className="grid gap-5 p-6">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-wide">
                  <span className="rounded-lg bg-primary px-2 py-2 text-on-primary">1. Work ready</span>
                  <span className="rounded-lg bg-surface-container px-2 py-2 text-on-surface">2. Submit</span>
                  <span className="rounded-lg border border-outline-variant/40 px-2 py-2 text-secondary">3. Supervisor decision</span>
                </div>
                {reviewError && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{reviewError}</span>
                  </div>
                )}
                {submissions.some((item) => String(item.task?._id || item.task || "") === String(reviewTask._id) && ["Draft", "Submitted"].includes(item.status)) && (
                  <label className="block"><span className={fieldLabelClass}>Use a saved draft</span><select value={deliverable.submissionId} onChange={(event) => setDeliverable({ ...deliverable, submissionId: event.target.value })} className={fieldInputClass}><option value="">Create a new submission below</option>{submissions.filter((item) => String(item.task?._id || item.task || "") === String(reviewTask._id) && ["Draft", "Submitted"].includes(item.status)).map((item) => <option key={item._id} value={item._id}>{item.title} · {item.status}</option>)}</select></label>
                )}
                {!deliverable.submissionId && <>
                  <label className="block"><span className={fieldLabelClass}>Submission title</span><input required value={deliverable.title} onChange={(event) => setDeliverable({ ...deliverable, title: event.target.value })} className={fieldInputClass} /></label>
                  <label className="block"><span className={fieldLabelClass}>Work summary</span><textarea rows="4" value={deliverable.note} onChange={(event) => setDeliverable({ ...deliverable, note: event.target.value })} placeholder="Explain what was completed, where the result is, and what the supervisor should verify." className={`${fieldInputClass} resize-y`} /></label>
                  <label className="block"><span className={fieldLabelClass}>Supporting file (maximum {MAX_UPLOAD_SIZE_MB} MB)</span><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif" onChange={(event) => { setReviewError(""); setDeliverable({ ...deliverable, file: event.target.files?.[0] || null }); }} className={fieldInputClass} /></label>
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-secondary"><span className="h-px flex-1 bg-outline-variant/40" />or link<span className="h-px flex-1 bg-outline-variant/40" /></div>
                  <label className="block"><span className={fieldLabelClass}>Supporting HTTPS link</span><input type="url" value={deliverable.link} onChange={(event) => setDeliverable({ ...deliverable, link: event.target.value })} placeholder="https://drive.google.com/..." className={fieldInputClass} /></label>
                </>}
              </div>
              <footer className="flex flex-col gap-3 border-t border-outline-variant/30 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xs text-xs leading-relaxed text-secondary">{reviewProgress || "Submitting moves this task to supervisor review. It becomes completed only after the supervisor accepts it."}</p><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setReviewTask(null)} className={secondaryActionClass}>Cancel</button><button disabled={saving} className={primaryActionClass}>{saving ? "Submitting…" : "Submit completed work"}</button></div></footer>
            </form>
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <form
              onSubmit={createTask}
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-outline-variant/30 bg-surface shadow-2xl"
            >
              <header className="flex items-start justify-between gap-4 border-b border-outline-variant/30 p-6">
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface">
                    {canCreateTask ? "Create a connected task" : "Propose a task"}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">
                    {canCreateTask ? "Define the outcome, priority, timing, owner, milestone, and prerequisite work." : "Suggest useful work for the leader or supervisor to review and assign."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-2 text-secondary hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={fieldLabelClass}>Task title</span>
                  <input
                    required
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                    placeholder="e.g. Validate the survey instrument"
                    className={fieldInputClass}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={fieldLabelClass}>Expected outcome</span>
                  <textarea
                    required
                    rows="3"
                    value={draft.acceptanceCriteria}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        acceptanceCriteria: event.target.value,
                      })
                    }
                    placeholder="What evidence proves this task is complete?"
                    className={`${fieldInputClass} resize-y`}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={fieldLabelClass}>Context (optional)</span>
                  <textarea
                    rows="2"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                    placeholder="Relevant method, source, or decision context"
                    className={`${fieldInputClass} resize-y`}
                  />
                </label>
                <label>
                  <span className={fieldLabelClass}>Priority</span>
                  <select
                    value={draft.priority}
                    onChange={(event) =>
                      setDraft({ ...draft, priority: event.target.value })
                    }
                    className={fieldInputClass}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
                <label>
                  <span className={fieldLabelClass}>Due date</span>
                  <input
                    type="date"
                    value={draft.dueDate}
                    onChange={(event) =>
                      setDraft({ ...draft, dueDate: event.target.value })
                    }
                    className={fieldInputClass}
                  />
                </label>
                <label>
                  <span className={fieldLabelClass}>Milestone</span>
                  <select value={draft.milestone} onChange={(event) => setDraft({ ...draft, milestone: event.target.value })} className={fieldInputClass}>
                    <option value="">No milestone yet</option>
                    {(activeProject.milestones || []).filter((item) => item.status !== "cancelled").map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
                  </select>
                </label>
                <label>
                  <span className={fieldLabelClass}>Project phase</span>
                  <input value={draft.phase} onChange={(event) => setDraft({ ...draft, phase: event.target.value })} placeholder="e.g. Data collection" className={fieldInputClass} />
                </label>
                <label className="sm:col-span-2">
                  <span className={fieldLabelClass}>Required deliverable</span>
                  <input value={draft.requiredDeliverable} onChange={(event) => setDraft({ ...draft, requiredDeliverable: event.target.value })} placeholder="e.g. Validated survey instrument and approval note" className={fieldInputClass} />
                </label>
                {canCreateTask && members.length > 0 && (
                  <label>
                    <span className={fieldLabelClass}>Owner</span>
                    <select
                      value={draft.assignedTo}
                      onChange={(event) =>
                        setDraft({ ...draft, assignedTo: event.target.value })
                      }
                      className={fieldInputClass}
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option
                          key={member._id || member.id || member}
                          value={member._id || member.id || member}
                        >
                          {member.name || member.email || "Student"}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label
                  className={
                    canCreateTask && members.length > 0 ? "" : "sm:col-span-2"
                  }
                >
                  <span className={fieldLabelClass}>Prerequisite tasks</span>
                  <select
                    multiple
                    value={draft.dependencies}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        dependencies: Array.from(
                          event.target.selectedOptions,
                          (option) => option.value,
                        ),
                      })
                    }
                    className={`${fieldInputClass} min-h-28`}
                  >
                    {tasks
                      .filter(
                        (task) =>
                          !completed(task) && task.status !== "cancelled",
                      )
                      .map((task) => (
                        <option key={task._id} value={task._id}>
                          {task.title}
                        </option>
                      ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-secondary">
                    Hold Ctrl/Cmd to choose multiple prerequisites.
                  </span>
                </label>
              </div>
              <footer className="flex justify-end gap-3 border-t border-outline-variant/30 p-5">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60"
                >
                  {saving ? "Saving…" : canCreateTask ? "Create official task" : "Submit suggestion"}
                </button>
              </footer>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default TasksMilestones;
