from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse

from app.api.deps import get_current_user, require_permission
from app.models.user import User
from app.schemas.research import ResearchAnalysisSection, ResearchGenerateRequest, ResearchJobResponse, ResearchReportDetail, ResearchReportListItem
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
        analysis_sections=[
            ResearchAnalysisSection(
                key=section.key,
                title=section.title,
                document_count=section.document_count,
                content=section.content,
            )
            for section in report.analysis_sections
        ],
    )


def serialize_job(job) -> ResearchJobResponse:
    return ResearchJobResponse(
        id=job.id,
        user_id=job.user_id,
        ticker=job.ticker,
        trade_date=job.trade_date,
        status=job.status,
        report_id=job.report_id,
        error_message=job.error_message,
        created_at=job.created_at.isoformat() + "Z",
        started_at=job.started_at.isoformat() + "Z" if job.started_at else None,
        finished_at=job.finished_at.isoformat() + "Z" if job.finished_at else None,
    )


@router.get("", response_model=list[ResearchReportListItem], dependencies=[Depends(require_permission("research.view"))])
def list_research_reports(
    ticker: str | None = Query(None, description="按标的代码筛选"),
    date: str | None = Query(None, description="按报告日期筛选 (YYYY-MM-DD)"),
):
    return [serialize_report_list_item(report) for report in ResearchService().list_reports(ticker=ticker, report_date=date)]


@router.post("/generate", response_model=ResearchJobResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_research_report(
    payload: ResearchGenerateRequest,
    current_user: User = Depends(require_permission("research.generate")),
):
    job = ResearchService().enqueue_generation(payload=payload, user_id=current_user.id)
    return serialize_job(job)


@router.get("/jobs", response_model=list[ResearchJobResponse], dependencies=[Depends(require_permission("research.view"))])
def list_research_jobs(current_user: User = Depends(get_current_user)):
    return [serialize_job(job) for job in ResearchService().list_jobs(user_id=current_user.id)]


@router.get("/jobs/{job_id}", response_model=ResearchJobResponse, dependencies=[Depends(require_permission("research.view"))])
def get_research_job(job_id: str, current_user: User = Depends(get_current_user)):
    job = ResearchService().get_job(job_id=job_id, user_id=current_user.id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return serialize_job(job)


@router.post("/jobs/{job_id}/cancel", response_model=ResearchJobResponse, dependencies=[Depends(require_permission("research.cancel"))])
def cancel_research_job(job_id: str, current_user: User = Depends(get_current_user)):
    try:
        job = ResearchService().cancel_job(job_id=job_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return serialize_job(job)


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
