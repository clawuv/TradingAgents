from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import json
import re
import subprocess
import sys
import threading
import uuid

from app.core.db import SessionLocal
from app.core.config import settings
from app.models.research_job import ResearchJob
from app.schemas.research import ResearchGenerateRequest


REPO_ROOT = Path(__file__).resolve().parents[3]
WORKSPACE_REPORTS_DIR = REPO_ROOT / "tradingagents" / "reports"
HOME_LOGS_DIR = Path.home() / ".tradingagents" / "logs"

COMPLETE_REPORT_DIR_RE = re.compile(r"^(?P<ticker>.+)_(?P<time>\d{6})$")
RATING_RE = re.compile(r"\*\*Rating\*\*:\s*([A-Za-z]+)|Rating:\s*\**([A-Za-z]+)\**", re.IGNORECASE)
EXECUTIVE_SUMMARY_RE = re.compile(r"\*\*Executive Summary\*\*:\s*(.+)")
RUNNING_PROCESSES: dict[str, subprocess.Popen[str]] = {}

COMPLETE_ANALYSIS_SECTION_SPECS = [
    (
        "1_analysts",
        "1_analysts",
        [
            ("market.md", "市场分析师"),
            ("sentiment.md", "社媒分析师"),
            ("news.md", "新闻分析师"),
            ("fundamentals.md", "基本面分析师"),
        ],
    ),
    (
        "2_research",
        "2_research",
        [
            ("bull.md", "多头研究员"),
            ("bear.md", "空头研究员"),
            ("manager.md", "研究经理"),
        ],
    ),
    (
        "3_trading",
        "3_trading",
        [
            ("trader.md", "交易员"),
        ],
    ),
    (
        "4_risk",
        "4_risk",
        [
            ("aggressive.md", "激进风险分析师"),
            ("conservative.md", "保守风险分析师"),
            ("neutral.md", "中性风险分析师"),
        ],
    ),
    (
        "5_portfolio",
        "5_portfolio",
        [
            ("decision.md", "组合经理"),
        ],
    ),
]

RUNTIME_ANALYSIS_SECTION_SPECS = [
    (
        "1_analysts",
        "1_analysts",
        [
            ("market_report.md", "市场分析师"),
            ("sentiment_report.md", "社媒分析师"),
            ("news_report.md", "新闻分析师"),
            ("fundamentals_report.md", "基本面分析师"),
        ],
    ),
    (
        "2_research",
        "2_research",
        [
            ("investment_plan.md", "研究团队决策"),
        ],
    ),
    (
        "3_trading",
        "3_trading",
        [
            ("trader_investment_plan.md", "交易团队计划"),
        ],
    ),
    (
        "5_portfolio",
        "5_portfolio",
        [
            ("final_trade_decision.md", "组合管理决策"),
        ],
    ),
]


@dataclass
class ResearchAnalysisSectionRecord:
    key: str
    title: str
    document_count: int
    content: str


@dataclass
class ResearchReportRecord:
    id: str
    title: str
    ticker: str
    report_date: str
    generated_at: str
    source_type: str
    source_label: str
    rating: str
    summary: str
    content: str
    analysis_sections: list[ResearchAnalysisSectionRecord]


class ResearchService:
    def list_reports(
        self,
        *,
        ticker: str | None = None,
        report_date: str | None = None,
    ) -> list[ResearchReportRecord]:
        reports = self._load_reports()
        if ticker:
            ticker_upper = ticker.strip().upper()
            reports = [r for r in reports if r.ticker == ticker_upper]
        if report_date:
            reports = [r for r in reports if r.report_date == report_date]
        return sorted(reports, key=lambda item: item.generated_at, reverse=True)

    def get_report(self, report_id: str) -> ResearchReportRecord | None:
        for report in self._load_reports():
            if report.id == report_id:
                return report
        return None

    def generate_report(self, payload: ResearchGenerateRequest) -> tuple[ResearchReportRecord, str]:
        result = self._run_generation_subprocess(payload=payload)
        report_path = Path(result["report_path"])
        report = self._build_complete_report(report_path)
        if report is None:
            raise RuntimeError("generated report could not be loaded")
        return report, str(result.get("decision", "")).strip()

    def enqueue_generation(self, *, payload: ResearchGenerateRequest, user_id: int) -> ResearchJob:
        db = SessionLocal()
        try:
            job = ResearchJob(
                id=f"research-job-{uuid.uuid4().hex[:16]}",
                user_id=user_id,
                ticker=payload.ticker.strip().upper(),
                trade_date=payload.trade_date,
                status="queued",
                request_payload=payload.model_dump(),
            )
            db.add(job)
            db.commit()
            db.refresh(job)
            job_id = job.id
        finally:
            db.close()

        worker = threading.Thread(target=self._run_generation_job, args=(job_id,), daemon=True)
        worker.start()

        db = SessionLocal()
        try:
            persisted = db.get(ResearchJob, job_id)
            assert persisted is not None
            db.expunge(persisted)
            return persisted
        finally:
            db.close()

    def list_jobs(self, *, user_id: int) -> list[ResearchJob]:
        db = SessionLocal()
        try:
            jobs = (
                db.query(ResearchJob)
                .filter(ResearchJob.user_id == user_id)
                .order_by(ResearchJob.created_at.desc())
                .limit(20)
                .all()
            )
            for job in jobs:
                db.expunge(job)
            return jobs
        finally:
            db.close()

    def get_job(self, *, job_id: str, user_id: int) -> ResearchJob | None:
        db = SessionLocal()
        try:
            job = (
                db.query(ResearchJob)
                .filter(ResearchJob.id == job_id, ResearchJob.user_id == user_id)
                .first()
            )
            if job is not None:
                db.expunge(job)
            return job
        finally:
            db.close()

    def cancel_job(self, *, job_id: str, user_id: int) -> ResearchJob:
        db = SessionLocal()
        try:
            job = (
                db.query(ResearchJob)
                .filter(ResearchJob.id == job_id, ResearchJob.user_id == user_id)
                .first()
            )
            if job is None:
                raise ValueError("job not found")
            if job.status in {"completed", "failed", "cancelled"}:
                raise ValueError("job can no longer be cancelled")

            process = RUNNING_PROCESSES.get(job_id)
            if process is not None and process.poll() is None:
                process.terminate()

            job.status = "cancelled"
            job.error_message = "任务已由用户取消"
            job.finished_at = datetime.utcnow()
            db.add(job)
            db.commit()
            db.refresh(job)
            db.expunge(job)
            return job
        finally:
            db.close()

    def _load_reports(self) -> list[ResearchReportRecord]:
        reports: list[ResearchReportRecord] = []
        complete_keys: set[tuple[str, str]] = set()

        if WORKSPACE_REPORTS_DIR.exists():
            for report_file in sorted(WORKSPACE_REPORTS_DIR.glob("*/*/complete_report.md")):
                report = self._build_complete_report(report_file)
                if report is None:
                    continue
                reports.append(report)
                complete_keys.add((report.ticker.upper(), report.report_date))
        if HOME_LOGS_DIR.exists():
            for ticker_dir in sorted(path for path in HOME_LOGS_DIR.iterdir() if path.is_dir()):
                for date_dir in sorted(path for path in ticker_dir.iterdir() if path.is_dir()):
                    key = (ticker_dir.name.upper(), date_dir.name)
                    if key in complete_keys:
                        continue
                    report = self._build_runtime_report(ticker_dir.name, date_dir)
                    if report is not None:
                        reports.append(report)

        return reports

    def _build_complete_report(self, report_file: Path) -> ResearchReportRecord | None:
        match = COMPLETE_REPORT_DIR_RE.match(report_file.parent.name)
        if match is None:
            return None

        ticker = match.group("ticker").upper()
        date_dir_name = report_file.parent.parent.name
        try:
            report_date = datetime.strptime(date_dir_name, "%Y%m%d").strftime("%Y-%m-%d")
        except ValueError:
            return None
        content = report_file.read_text(encoding="utf-8")
        generated_at = self._extract_generated_at(content) or self._format_timestamp(report_file.stat().st_mtime)

        return ResearchReportRecord(
            id=f"complete::{ticker}::{report_date}",
            title=f"{ticker} 交易分析报告",
            ticker=ticker,
            report_date=report_date,
            generated_at=generated_at,
            source_type="complete_report",
            source_label="TradingAgents 完整报告",
            rating=self._extract_rating(content),
            summary=self._extract_summary(content),
            content=content,
            analysis_sections=self._build_analysis_sections_from_directory(report_file.parent),
        )

    def _build_runtime_report(self, ticker: str, date_dir: Path) -> ResearchReportRecord | None:
        reports_dir = date_dir / "reports"
        if not reports_dir.exists():
            return None

        section_specs = [
            ("market_report.md", "## I. Analyst Team Reports\n\n### Market Analyst"),
            ("sentiment_report.md", "### Social Analyst"),
            ("news_report.md", "### News Analyst"),
            ("fundamentals_report.md", "### Fundamentals Analyst"),
            ("investment_plan.md", "## II. Research Team Decision"),
            ("trader_investment_plan.md", "## III. Trading Team Plan"),
            ("final_trade_decision.md", "## IV. Portfolio Management Decision"),
        ]

        content_parts = [f"# Trading Analysis Report: {ticker.upper()}", "", f"Generated: {date_dir.name}", ""]
        found_any = False
        for file_name, heading in section_specs:
            path = reports_dir / file_name
            if not path.exists():
                continue
            body = path.read_text(encoding="utf-8").strip()
            if not body:
                continue
            found_any = True
            content_parts.extend([heading, "", body, ""])

        if not found_any:
            return None

        final_path = reports_dir / "final_trade_decision.md"
        content = "\n".join(content_parts).strip()
        generated_at = self._format_timestamp(final_path.stat().st_mtime if final_path.exists() else reports_dir.stat().st_mtime)

        return ResearchReportRecord(
            id=f"runtime::{ticker.upper()}::{date_dir.name}",
            title=f"{ticker.upper()} 运行研报",
            ticker=ticker.upper(),
            report_date=date_dir.name,
            generated_at=generated_at,
            source_type="runtime_logs",
            source_label="TradingAgents 运行日志报告",
            rating=self._extract_rating(content),
            summary=self._extract_summary(content),
            content=content,
            analysis_sections=self._build_analysis_sections_from_runtime_reports(reports_dir),
        )

    def _build_analysis_sections_from_directory(self, report_dir: Path) -> list[ResearchAnalysisSectionRecord]:
        sections: list[ResearchAnalysisSectionRecord] = []
        for key, title, documents in COMPLETE_ANALYSIS_SECTION_SPECS:
            parts = [f"# {title}", ""]
            count = 0
            section_dir = report_dir / key
            for file_name, label in documents:
                file_path = section_dir / file_name
                if not file_path.exists():
                    continue
                body = file_path.read_text(encoding="utf-8").strip()
                if not body:
                    continue
                count += 1
                parts.extend([f"## {label}", "", body, ""])
            if count == 0:
                continue
            sections.append(
                ResearchAnalysisSectionRecord(
                    key=key,
                    title=title,
                    document_count=count,
                    content="\n".join(parts).strip(),
                )
            )
        return sections

    def _build_analysis_sections_from_runtime_reports(self, reports_dir: Path) -> list[ResearchAnalysisSectionRecord]:
        sections: list[ResearchAnalysisSectionRecord] = []
        for key, title, documents in RUNTIME_ANALYSIS_SECTION_SPECS:
            parts = [f"# {title}", ""]
            count = 0
            for file_name, label in documents:
                file_path = reports_dir / file_name
                if not file_path.exists():
                    continue
                body = file_path.read_text(encoding="utf-8").strip()
                if not body:
                    continue
                count += 1
                parts.extend([f"## {label}", "", body, ""])
            if count == 0:
                continue
            sections.append(
                ResearchAnalysisSectionRecord(
                    key=key,
                    title=title,
                    document_count=count,
                    content="\n".join(parts).strip(),
                )
            )
        return sections

    def _extract_generated_at(self, content: str) -> str | None:
        for line in content.splitlines():
            if line.startswith("Generated:"):
                return line.replace("Generated:", "", 1).strip()
        return None

    def _extract_rating(self, content: str) -> str:
        match = RATING_RE.search(content)
        if match is None:
            return "未知"
        rating = (match.group(1) or match.group(2) or "").strip().capitalize()
        return {"Buy": "看多", "Hold": "中性", "Sell": "谨慎"}.get(rating, rating or "未知")

    def _extract_summary(self, content: str) -> str:
        match = EXECUTIVE_SUMMARY_RE.search(content)
        if match is not None:
            return match.group(1).strip()

        ignored_prefixes = ("#", "Generated:", "##", "###", "|", "---", "**Rating**", "**Executive Summary**")
        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith(ignored_prefixes):
                continue
            if len(line) >= 24:
                return line[:180]
        return "暂无摘要"

    def _format_timestamp(self, timestamp: float) -> str:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")

    def _resolve_runner_python(self) -> str:
        configured = Path(settings.resolved_research_runner_python)
        if configured.exists():
            return str(configured)
        return sys.executable

    def _normalize_output_language(self, value: str) -> str:
        return {"中文": "Chinese", "english": "English", "english ": "English"}.get(value.strip().lower(), value)

    def _generation_script(self) -> str:
        return """
import json
import sys
from datetime import datetime
from pathlib import Path

payload = json.loads(sys.argv[1])
repo_root = Path(payload["repo_root"])
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from cli.main import save_report_to_disk
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.graph.trading_graph import TradingAgentsGraph

config = DEFAULT_CONFIG.copy()
config.update(payload["config_overrides"])
ticker = payload["ticker"].strip().upper()
trade_date = payload["trade_date"]
graph = TradingAgentsGraph(
    selected_analysts=payload["selected_analysts"],
    debug=False,
    config=config,
)
final_state, decision = graph.propagate(ticker, trade_date)
save_path = repo_root / "tradingagents" / "reports" / trade_date.replace("-", "") / f"{ticker}_{datetime.now().strftime('%H%M%S')}"
report_path = save_report_to_disk(final_state, ticker, save_path)
print(json.dumps({"report_path": str(report_path), "decision": decision}, ensure_ascii=False))
""".strip()

    def _build_generation_payload(self, payload: ResearchGenerateRequest) -> dict:
        return {
            "ticker": payload.ticker.strip().upper(),
            "trade_date": payload.trade_date,
            "selected_analysts": payload.selected_analysts,
            "config_overrides": {
                "output_language": self._normalize_output_language(payload.output_language),
                "llm_provider": payload.llm_provider,
                "quick_think_llm": payload.quick_think_llm,
                "deep_think_llm": payload.deep_think_llm,
                "max_debate_rounds": payload.max_debate_rounds,
                "max_risk_discuss_rounds": payload.max_risk_discuss_rounds,
                "checkpoint_enabled": payload.checkpoint_enabled,
            },
            "repo_root": str(REPO_ROOT),
        }

    def _run_generation_subprocess(self, *, payload: ResearchGenerateRequest, job_id: str | None = None) -> dict:
        request_payload = self._build_generation_payload(payload)
        process = subprocess.Popen(
            [self._resolve_runner_python(), "-c", self._generation_script(), json.dumps(request_payload)],
            cwd=REPO_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if job_id:
            RUNNING_PROCESSES[job_id] = process
        try:
            stdout, stderr = process.communicate(timeout=settings.research_generation_timeout_seconds)
        finally:
            if job_id:
                RUNNING_PROCESSES.pop(job_id, None)

        if process.returncode != 0:
            stderr_text = (stderr or stdout or "research generation failed").strip()
            raise RuntimeError(stderr_text)

        try:
            return json.loads(stdout.strip().splitlines()[-1])
        except (IndexError, json.JSONDecodeError) as exc:
            raise RuntimeError("research generation returned an invalid payload") from exc

    def _run_generation_job(self, job_id: str) -> None:
        db = SessionLocal()
        try:
            job = db.get(ResearchJob, job_id)
            if job is None:
                return
            job.status = "running"
            job.started_at = datetime.utcnow()
            db.add(job)
            db.commit()

            payload = ResearchGenerateRequest(**job.request_payload)
            try:
                result = self._run_generation_subprocess(payload=payload, job_id=job_id)
                report = self._build_complete_report(Path(result["report_path"]))
                if report is None:
                    raise RuntimeError("generated report could not be loaded")
                decision = str(result.get("decision", "")).strip()
                db.refresh(job)
                if job.status == "cancelled":
                    return
                job.status = "completed"
                job.decision = decision
                job.report_id = report.id
                job.finished_at = datetime.utcnow()
                job.error_message = None
            except Exception as exc:
                db.refresh(job)
                if job.status != "cancelled":
                    job.status = "failed"
                    job.error_message = str(exc)
                    job.finished_at = datetime.utcnow()

            db.add(job)
            db.commit()
        finally:
            db.close()
