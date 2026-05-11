from datetime import datetime

DEFAULT_LLM_PROVIDER = "deepseek"
DEFAULT_OUTPUT_LANGUAGE = "Chinese"
DEFAULT_ANALYSIS_DATE = datetime.now().strftime("%Y-%m-%d")
DEFAULT_ANALYSTS = ["market", "social", "news", "fundamentals"]
DEFAULT_RESEARCH_DEPTH = 1
DEFAULT_TICKER = "SPY"

CLI_CONFIG = {
    # Announcements
    "announcements_url": "https://api.tauric.ai/v1/announcements",
    "announcements_timeout": 1.0,
    "announcements_fallback": "[cyan]For more information, please visit[/cyan] [link=https://github.com/TauricResearch]https://github.com/TauricResearch[/link]",
    # LLM selection
    "default_llm_provider": DEFAULT_LLM_PROVIDER,
    "auto_use_default_llm_profile": True,
    # Analysis defaults
    "default_output_language": DEFAULT_OUTPUT_LANGUAGE,
    "auto_use_default_output_language": True,
    "default_analysis_date": DEFAULT_ANALYSIS_DATE,
    "auto_use_default_analysis_date": True,
    "default_analysts": DEFAULT_ANALYSTS,
    "auto_use_default_analysts": True,
    "default_research_depth": DEFAULT_RESEARCH_DEPTH,
    "auto_use_default_research_depth": True,
    "default_ticker": DEFAULT_TICKER,
    "auto_use_default_ticker": True,
}
