"""In-memory job tracking for Telegram-triggered analyses."""

from __future__ import annotations

from dataclasses import asdict, dataclass, replace
from datetime import datetime
import json
from pathlib import Path


@dataclass(frozen=True)
class AnalysisJob:
    """Represents one Telegram analysis request."""

    job_id: str
    chat_id: int
    ticker: str
    trade_date: str
    status: str
    created_at: str
    updated_at: str
    error: str = ""


class TelegramJobStore:
    """Job registry keyed by chat and job id with optional JSON persistence."""

    def __init__(self, storage_path: str | Path | None = None) -> None:
        self._jobs: dict[str, AnalysisJob] = {}
        self._job_order_by_chat: dict[int, list[str]] = {}
        self._counter = 0
        self._storage_path = Path(storage_path) if storage_path else None
        if self._storage_path:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            self._load()

    def create_job(self, chat_id: int, ticker: str, trade_date: str) -> AnalysisJob:
        self._counter += 1
        now = self._now()
        job = AnalysisJob(
            job_id=f"job-{self._counter:04d}",
            chat_id=chat_id,
            ticker=ticker,
            trade_date=trade_date,
            status="queued",
            created_at=now,
            updated_at=now,
        )
        self._jobs[job.job_id] = job
        self._job_order_by_chat.setdefault(chat_id, []).append(job.job_id)
        self._save()
        return job

    def get_job(self, job_id: str) -> AnalysisJob | None:
        return self._jobs.get(job_id)

    def list_jobs(self, chat_id: int, limit: int = 5) -> list[AnalysisJob]:
        job_ids = self._job_order_by_chat.get(chat_id, [])
        selected = job_ids[-limit:]
        return [self._jobs[job_id] for job_id in reversed(selected)]

    def count_active_jobs(self, chat_id: int) -> int:
        """Return queued/running jobs for a chat."""
        return sum(
            1
            for job in self.list_jobs(chat_id, limit=1000)
            if job.status in {"queued", "running"}
        )

    def latest_job(self, chat_id: int) -> AnalysisJob | None:
        """Return the most recent job for a chat, if any."""
        jobs = self.list_jobs(chat_id, limit=1)
        return jobs[0] if jobs else None

    def update_status(self, job_id: str, status: str, *, error: str = "") -> AnalysisJob:
        job = self._jobs[job_id]
        updated = replace(
            job,
            status=status,
            updated_at=self._now(),
            error=error,
        )
        self._jobs[job_id] = updated
        self._save()
        return updated

    def delete_chat(self, chat_id: int) -> None:
        """Delete all jobs belonging to a chat."""
        job_ids = self._job_order_by_chat.pop(chat_id, [])
        for job_id in job_ids:
            self._jobs.pop(job_id, None)
        self._save()

    def _load(self) -> None:
        if not self._storage_path or not self._storage_path.exists():
            return
        raw = json.loads(self._storage_path.read_text(encoding="utf-8"))
        self._counter = raw.get("counter", 0)
        self._job_order_by_chat = {
            int(chat_id): list(job_ids)
            for chat_id, job_ids in raw.get("job_order_by_chat", {}).items()
        }
        self._jobs = {
            job_id: AnalysisJob(**payload)
            for job_id, payload in raw.get("jobs", {}).items()
        }

    def _save(self) -> None:
        if not self._storage_path:
            return
        payload = {
            "counter": self._counter,
            "job_order_by_chat": {
                str(chat_id): job_ids
                for chat_id, job_ids in self._job_order_by_chat.items()
            },
            "jobs": {
                job_id: asdict(job)
                for job_id, job in self._jobs.items()
            },
        }
        self._storage_path.write_text(
            json.dumps(payload, indent=2, sort_keys=True),
            encoding="utf-8",
        )

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
