from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse

from app.api.deps import require_permission
from app.schemas.research import ResearchReportDetail, ResearchReportListItem
from app.services.research_service import ResearchService


router = APIRouter(prefix="/v1/research/reports", tags=["research"])


def serialize_report_list_item(report) -> ResearchReportListItem:
    return ResearchReportListItem(
        id=report.id,
        title=report.title,
        ticker=report.ticker,
        report_date=report.report_date,
        generated_at=report.generated_at,
        source_type=report.source_type,
        source_label=report.source_label,
        rating=report.rating,
        summary=report.summary,
    )


def serialize_report_detail(report) -> ResearchReportDetail:
    return ResearchReportDetail(
        **serialize_report_list_item(report).model_dump(),
        content=report.content,
    )


@router.get("", response_model=list[ResearchReportListItem], dependencies=[Depends(require_permission("research.view"))])
def list_research_reports(
    ticker: str | None = Query(None, description="按标的代码筛选"),
    date: str | None = Query(None, description="按报告日期筛选 (YYYY-MM-DD)"),
):
    return [serialize_report_list_item(report) for report in ResearchService().list_reports(ticker=ticker, report_date=date)]


@router.get("/{report_id}", response_model=ResearchReportDetail, dependencies=[Depends(require_permission("research.view"))])
def get_research_report(report_id: str):
    report = ResearchService().get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="report not found")
    return serialize_report_detail(report)


@router.get("/{report_id}/download", response_class=PlainTextResponse, dependencies=[Depends(require_permission("research.download"))])
def download_research_report(report_id: str):
    report = ResearchService().get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="report not found")
    filename = f"{report.ticker}_{report.report_date}.md"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return PlainTextResponse(report.content, media_type="text/markdown; charset=utf-8", headers=headers)
