from pydantic import BaseModel, Field


class ResearchGenerateRequest(BaseModel):
    ticker: str = Field(min_length=1, max_length=24)
    trade_date: str
    output_language: str = "Chinese"
    llm_provider: str = "deepseek"
    quick_think_llm: str = "deepseek-v4-flash"
    deep_think_llm: str = "deepseek-v4-pro"
    max_debate_rounds: int = Field(default=1, ge=1, le=5)
    max_risk_discuss_rounds: int = Field(default=1, ge=1, le=5)
    checkpoint_enabled: bool = True
    selected_analysts: list[str] = Field(default_factory=lambda: ["market", "news", "fundamentals"])


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


class ResearchAnalysisSection(BaseModel):
    key: str
    title: str
    document_count: int
    content: str


class ResearchReportDetail(ResearchReportListItem):
    content: str
    analysis_sections: list[ResearchAnalysisSection] = Field(default_factory=list)


class ResearchGenerateResponse(BaseModel):
    decision: str
    report: ResearchReportDetail


class ResearchJobResponse(BaseModel):
    id: str
    user_id: int
    ticker: str
    trade_date: str
    status: str
    report_id: str | None = None
    error_message: str | None = None
    created_at: str
    started_at: str | None = None
    finished_at: str | None = None
