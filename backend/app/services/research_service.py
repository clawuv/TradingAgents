from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import re


REPO_ROOT = Path(__file__).resolve().parents[3]
WORKSPACE_REPORTS_DIR = REPO_ROOT / "tradingagents" / "reports"
HOME_LOGS_DIR = Path.home() / ".tradingagents" / "logs"

COMPLETE_REPORT_DIR_RE = re.compile(r"^(?P<ticker>.+)_(?P<date>\d{8})_\d{6}$")
RATING_RE = re.compile(r"\*\*Rating\*\*:\s*([A-Za-z]+)|Rating:\s*\**([A-Za-z]+)\**", re.IGNORECASE)
EXECUTIVE_SUMMARY_RE = re.compile(r"\*\*Executive Summary\*\*:\s*(.+)")


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


class ResearchService:
    def list_reports(self) -> list[ResearchReportRecord]:
        reports = self._load_reports()
        return sorted(reports, key=lambda item: item.generated_at, reverse=True)

    def get_report(self, report_id: str) -> ResearchReportRecord | None:
        for report in self._load_reports():
            if report.id == report_id:
                return report
        return None

    def _load_reports(self) -> list[ResearchReportRecord]:
        reports: list[ResearchReportRecord] = []
        complete_keys: set[tuple[str, str]] = set()

        if WORKSPACE_REPORTS_DIR.exists():
          for report_file in sorted(WORKSPACE_REPORTS_DIR.glob("*/complete_report.md")):
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
        report_date = datetime.strptime(match.group("date"), "%Y%m%d").strftime("%Y-%m-%d")
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
        )

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
