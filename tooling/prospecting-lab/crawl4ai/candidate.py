"""Future container entrypoint. Not executed by static tests or the planner."""
import asyncio
import contextlib
import io
import json
from pathlib import Path


async def extract():
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

    html = Path('/lab/fixture.html').read_text(encoding='utf-8')
    schema = json.loads(Path('/lab/schema.json').read_text(encoding='utf-8'))
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        extraction_strategy=JsonCssExtractionStrategy(schema),
        excluded_tags=['aside'],
        page_timeout=15000,
        verbose=False,
    )
    async with AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False)) as crawler:
        result = await crawler.arun(url='raw:' + html, config=config)
        if not result.success:
            raise ValueError('candidate failed')
        return {'success': True, 'records': json.loads(result.extracted_content)}


if __name__ == '__main__':
    try:
        # Candidate logs are not evidence and must never be relayed or persisted.
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            output = asyncio.run(asyncio.wait_for(extract(), timeout=30))
        print(json.dumps(output, sort_keys=True))
    except Exception:
        print('{"success":false}')
        raise SystemExit(1)
