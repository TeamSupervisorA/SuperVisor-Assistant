import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const ProgressLogs = () => {
  const { activeProject, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState({});
  const [busyId, setBusyId] = useState("");
  const projectId = activeProject?._id;

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await apiFetch(
        `/api/projects/${projectId}/progress-logs`,
      );
      setLogs(response.data || []);
    } catch (error) {
      setMessage(error.message);
    }
  }, [projectId]);
  useEffect(() => {
    if (projectId) load();
    else setLogs([]);
  }, [projectId, load]);

  const create = async (event) => {
    event.preventDefault();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    try {
      const response = await apiFetch(
        `/api/projects/${activeProject._id}/progress-logs`,
        {
          method: "POST",
          body: JSON.stringify({ weekStart, summary, blockers }),
        },
      );
      setLogs((current) => [response.data, ...current]);
      setSummary("");
      setBlockers("");
      setMessage("Weekly progress draft saved. Submit it when ready.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const submit = async (id) => {
    try {
      const response = await apiFetch(`/api/progress-logs/${id}/submit`, {
        method: "POST",
      });
      setLogs((current) =>
        current.map((log) =>
          log._id === id ? { ...log, ...response.data } : log,
        ),
      );
      setMessage("Progress log submitted.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const respond = async (id) => {
    const responseMessage = String(responses[id] || "").trim();
    if (!responseMessage) {
      setMessage("Write an actionable response before sending it.");
      return;
    }
    setBusyId(id);
    try {
      const response = await apiFetch(`/api/progress-logs/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ message: responseMessage }),
      });
      setLogs((current) =>
        current.map((log) => (log._id === id ? response.data : log)),
      );
      setResponses((current) => ({ ...current, [id]: "" }));
      setMessage("Supervisor response shared with the student.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyId("");
    }
  };

  if (!activeProject)
    return (
      <div className="min-h-[60vh] grid place-items-center p-6 text-secondary">
        Select a project to view progress logs.
      </div>
    );
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header>
        <p className="text-primary font-semibold text-sm uppercase tracking-wider">
          Evidence and accountability
        </p>
        <h1 className="text-3xl font-bold text-on-surface mt-1">
          Weekly progress logs
        </h1>
        <p className="text-secondary mt-2">{activeProject.title}</p>
      </header>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-primary/10 border border-primary/30 p-3"
        >
          {message}
        </p>
      )}
      {user?.role === "student" && (
        <form
          onSubmit={create}
          className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-6"
        >
          <h2 className="font-bold text-lg">Record this week’s progress</h2>
          <textarea
            required
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows="4"
            placeholder="Work completed, evidence and next step"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
          />
          <textarea
            value={blockers}
            onChange={(event) => setBlockers(event.target.value)}
            rows="2"
            placeholder="Blockers (if any)"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
          />
          <button className="rounded-xl bg-primary text-on-primary px-5 py-3 font-semibold">
            Save draft
          </button>
        </form>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Submitted and draft logs</h2>
        {logs.length === 0 ? (
          <p className="text-secondary">No logs yet.</p>
        ) : (
          logs.map((log) => {
            const currentUserId = String(user?._id || user?.id || "");
            const authorId = String(
              log.author?._id || log.author?.id || log.author || "",
            );
            const canRespond =
              ["supervisor", "admin"].includes(user?.role) &&
              log.state === "submitted";
            return (
              <article
                key={log._id}
                className="rounded-2xl border border-outline-variant/30 bg-surface p-5 space-y-3"
              >
                <div className="flex justify-between gap-4">
                  <strong>
                    {new Date(log.weekStart).toLocaleDateString()} ·{" "}
                    {log.author?.name || "You"}
                  </strong>
                  <span className="capitalize text-secondary">{log.state}</span>
                </div>
                <p className="whitespace-pre-wrap">{log.summary}</p>
                {log.blockers && (
                  <p className="rounded-lg bg-tertiary-container/20 p-3">
                    <strong>Blockers:</strong> {log.blockers}
                  </p>
                )}
                {log.supervisorResponse?.message && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Supervisor response
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {log.supervisorResponse.message}
                    </p>
                    <p className="mt-2 text-xs text-secondary">
                      {log.supervisorResponse.respondedBy?.name || "Supervisor"}{" "}
                      ·{" "}
                      {log.supervisorResponse.respondedAt
                        ? new Date(
                            log.supervisorResponse.respondedAt,
                          ).toLocaleString()
                        : ""}
                    </p>
                  </div>
                )}
                {currentUserId &&
                  currentUserId === authorId &&
                  log.state === "draft" && (
                    <button
                      onClick={() => submit(log._id)}
                      className="rounded-lg border border-primary text-primary px-4 py-2 font-semibold"
                    >
                      Submit log
                    </button>
                  )}
                {canRespond && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor={`response-${log._id}`}>
                      Response to {log.author?.name || "student"}
                    </label>
                    <textarea
                      id={`response-${log._id}`}
                      value={responses[log._id] || ""}
                      onChange={(event) =>
                        setResponses((current) => ({
                          ...current,
                          [log._id]: event.target.value,
                        }))
                      }
                      maxLength={3000}
                      rows="2"
                      placeholder="Acknowledge progress, answer blockers, and state the next action"
                      className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm"
                    />
                    <button
                      disabled={busyId === log._id}
                      onClick={() => respond(log._id)}
                      className="rounded-xl bg-primary px-4 py-2 font-bold text-on-primary disabled:opacity-60"
                    >
                      {busyId === log._id
                        ? "Sending…"
                        : log.supervisorResponse?.message
                          ? "Update response"
                          : "Send response"}
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default ProgressLogs;
