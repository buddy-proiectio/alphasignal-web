import os
import re
import sys
import json
import markdown
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# --- Configuration ---
NEW_POST_URL = "https://studio.premium.naver.com/post"
TITLE_INPUT_SELECTOR = ".se-title-text span.__se-node"
BODY_INPUT_SELECTOR = ".se-section-text span.__se-node"
PAYWALL_BUTTON = ".se-paywall-toolbar-button"
NEXT_BUTTON = "#nextBtn"
STATE_FILE = os.path.join(os.path.dirname(__file__), ".naver_session.json")


def process_markdown_content(content: str, file_path: str) -> str:
    """Cuts content based on report type and appends a disclaimer."""
    is_premarket = "premarket" in file_path.lower()

    if is_premarket:
        # Cut everything before the first `[`
        idx = content.find("[")
        if idx != -1:
            content = content[idx:]
    else:
        # Cut everything before `### Weekly Schedule` / `### 주간 일정`
        match = re.search(
            r"(###\s+(?:Weekly Schedule|주간 일정))", content, re.IGNORECASE
        )
        if match:
            content = content[match.start() :]

    disclaimer = "\n\n---\n❇︎ 중요 안내사항 ❇︎\n1. 본 리포트(Alpha Signal)는 투자 판단을 돕기 위한 순수 데이터 제공을 목적으로 하며, 특정 종목에 대한 매수·매도 등 투자 권유나 자문을 의미하지 않습니다.\n2. 제공되는 모든 내용은 자체 개발한 AI 알고리즘이 미국 시장의 영문 공시 및 뉴스 원문에서 팩트 수치(KPI)만을 기계적으로 추출한 결과물이며, 작성자의 주관적 의견이 배제되어 있습니다.\n3. 자동화된 시스템을 통한 수집 과정에서 오류, 지연 또는 누락이 발생할 수 있으므로 정보의 완전성을 보장하지 않습니다. 중요한 수치는 반드시 영문 원문을 교차 검증하시기 바랍니다.\n4. 본 리포트의 데이터를 활용한 모든 투자 판단과 결과에 대한 최종 책임은 전적으로 구독자 본인에게 있습니다.\n5. 본 채널에서 발행한 모든 콘텐츠는 3개월 경과 후 구독상품에서 제외됩니다.\n6. 서비스 운영에 관한 질문은 이메일을 통해 문의하여 주시기 바랍니다. 리포트의 해석 또는 투자 판단에 영향을 미치는 문의에는 답변하지 않습니다."

    return content.strip() + disclaimer


def split_markdown_by_paywall(content: str, file_path: str) -> tuple[str, str]:
    """Splits markdown into free and paid parts based on report type."""
    is_premarket = "premarket" in file_path.lower()
    
    if is_premarket:
        # Premarket: Split below the first article.
        # Since the header is already removed, content starts directly with the first article.
        parts = content.split("\n\n")
        if len(parts) > 1:
            free_markdown = parts[0]
            paid_markdown = "\n\n".join(parts[1:])
        else:
            free_markdown = content
            paid_markdown = ""
    else:
        # Regular report: Split above "### General" or "### 경제 일반"
        pattern = r"(\n*###\s+(?:General|경제 일반))"
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            split_idx = match.start()
            free_markdown = content[:split_idx]
            paid_markdown = content[split_idx:]
        else:
            free_markdown = content
            paid_markdown = ""
            
    return free_markdown.strip(), paid_markdown.strip()


def extract_metadata(file_path: str) -> str:
    """Extracts date from filename to generate the title."""
    # Extract date from filename (e.g. 20260712)
    date_match = re.search(r"(\d{4})(\d{2})(\d{2})", file_path)
    if date_match:
        year, month, day = date_match.groups()
        post_date = f"{year}년 {month}월 {day}일"
    else:
        post_date = "알 수 없는 날짜"

    is_korean = "_ko.md" in file_path
    is_premarket = "premarket" in file_path.lower()

    if is_premarket:
        base_title = f"{post_date} 프리마켓"
    else:
        base_title = f"{post_date} 알파 시그널"

    title = base_title if is_korean else f"{base_title} (EN)"

    return title


def read_markdown_file(file_path: str) -> str:
    """Reads the target markdown file safely."""
    if not file_path:
        print("Error: POST_FILE_PATH environment variable is not set.")
        sys.exit(1)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        sys.exit(1)


def paste_rich_text(page, html_content: str):
    """Writes HTML content to clipboard and simulates paste command."""
    # Use json.dumps to safely escape newlines and quotes for JavaScript injection
    escaped_html = json.dumps(html_content)
    clipboard_injection_js = f"""
    async () => {{
        const blob = new Blob([{escaped_html}], {{ type: 'text/html' }});
        const data = [new ClipboardItem({{ 'text/html': blob }})];
        await navigator.clipboard.write(data);
    }}
    """
    page.evaluate(clipboard_injection_js)
    page.keyboard.press("Meta+V")


def publish_to_naver(title: str, free_html: str, paid_html: str, keep_alive: bool = True):
    """Executes the Playwright publishing flow with paywall splitting."""
    with Stealth().use_sync(sync_playwright()) as p:
        if not os.path.exists(STATE_FILE):
            print(f"Didn't find login session file ({STATE_FILE}).")
            print("You need to log in once. Please log in when the browser opens.")

            browser = p.chromium.launch(
                headless=False,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            )
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            page = context.new_page()
            page.goto(NEW_POST_URL)

            input("✅ Press [Enter] key after you finish logging in...")

            context.storage_state(path=STATE_FILE)
            print(
                f"Session file saved successfully ({STATE_FILE})! Please run the script again."
            )
            browser.close()
            sys.exit(0)

        # TODO: Set headless=True when running reliably in background
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )

        storage_state = STATE_FILE if os.path.exists(STATE_FILE) else None
        context = browser.new_context(
            viewport={"width": 1280, "height": 800}, storage_state=storage_state
        )
        context.grant_permissions(["clipboard-read", "clipboard-write"])

        page = context.new_page()

        try:
            print("Navigating to Naver Premium Studio...")
            page.goto(NEW_POST_URL)
            page.wait_for_timeout(3000)

            print("Clicking '텍스트' (Text content) button...")
            try:
                page.wait_for_selector("text='텍스트'", state="visible", timeout=10000)
                page.click("text='텍스트'", force=True)
                page.wait_for_timeout(5000)
            except Exception as e:
                print("Could not find or click '텍스트' button. Proceeding anyway. Error:", e)

            # Wait for editor iframe and construct FrameLocator
            print("Locating editor iframe...")
            try:
                page.wait_for_selector("iframe[src*='editor']", state="attached", timeout=15000)
                editor_frame = page.frame_locator("iframe[src*='editor']")
            except Exception as e:
                print("Failed to locate editor iframe. Operating on main page instead.", e)
                editor_frame = page # type: ignore

            print("Entering title...")
            try:
                # 1. Click the title wrapper to initialize editor focus
                editor_frame.locator(".se-title-text").first.click(force=True)
                page.wait_for_timeout(500)
                
                # 2. Focus the exact contenteditable span and type
                title_loc = editor_frame.locator(TITLE_INPUT_SELECTOR).first
                title_loc.wait_for(state="attached", timeout=15000)
                title_loc.focus()
                page.wait_for_timeout(500)
                page.keyboard.type(title, delay=100)
            except Exception as e:
                print("Could not enter title. Error:", e)

            print("Pasting free content...")
            try:
                # 1. Click the body area to position the cursor
                editor_frame.locator(".se-section-text").first.click(force=True)
                page.wait_for_timeout(500)
                
                # 2. Focus the actual contenteditable span and paste
                body_loc = editor_frame.locator(BODY_INPUT_SELECTOR).first
                body_loc.wait_for(state="attached", timeout=10000)
                body_loc.focus()
                page.wait_for_timeout(500)
                
                paste_rich_text(page, free_html)
                page.wait_for_timeout(2000)
            except Exception as e:
                print("Failed to paste free content into body:", e)

            print("Inserting paywall...")
            try:
                paywall_loc = editor_frame.locator(PAYWALL_BUTTON).first
                paywall_loc.wait_for(state="attached", timeout=5000)
                paywall_loc.click(force=True)
                page.wait_for_timeout(1000)
            except Exception as e:
                print("Could not click paywall button:", e)

            if paid_html:
                print("Pasting paid content...")
                try:
                    # Paste paid content right after the paywall block
                    paste_rich_text(page, paid_html)
                    page.wait_for_timeout(2000)
                except Exception as e:
                    print("Failed to paste paid content into body:", e)

            print("Clicking next button...")
            try:
                next_loc = editor_frame.locator(NEXT_BUTTON).first
                next_loc.wait_for(state="attached", timeout=5000)
                next_loc.click(force=True)
                page.wait_for_timeout(3000)
                print("Proceeded to next step!")
            except Exception as e:
                print("Could not click next button:", e)

            # ALWAYS save session state to refresh it
            context.storage_state(path=STATE_FILE)
            print("Session state refreshed successfully.")

            if keep_alive:
                print("\n============================================================")
                print("Browser is kept open for manual review/publishing.")
                print("Press [Enter] in this terminal to close the browser...")
                print("============================================================\n")
                input()

        except Exception as e:
            print(f"Failed to publish to Naver Premium: {e}")
            raise e
        finally:
            browser.close()


def main():
    file_path = os.environ.get("POST_FILE_PATH", "")
    content = read_markdown_file(file_path)
    print(f"Loaded Markdown: {file_path}")

    title = extract_metadata(file_path)
    print(f"Title: {title}")

    raw_body = process_markdown_content(content, file_path)
    free_markdown, paid_markdown = split_markdown_by_paywall(raw_body, file_path)

    # Render Markdown to HTML (keep newlines for proper block parsing)
    free_html = markdown.markdown(free_markdown, extensions=["tables"])
    paid_html = markdown.markdown(paid_markdown, extensions=["tables"]) if paid_markdown else ""

    publish_to_naver(title, free_html, paid_html, keep_alive=True)


if __name__ == "__main__":
    main()
