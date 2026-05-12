from pydantic import BaseModel


class ResearchReportListItem(BaseModel):
    id: str
    title: str
    ticker: str
    report_date: str
    generated_at: str
    source_type: str
    source_label: str
    rating: str
    summary: str


class ResearchReportDetail(ResearchReportListItem):
    content: str
