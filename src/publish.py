import os
import re
import sys
import markdown
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# --- Configuration ---
NEW_POST_URL = "https://studio.premium.naver.com/post"
STATE_FILE = os.path.join(os.path.dirname(__file__), ".naver_session.json")

# --- CSS Selectors ---
TITLE_INPUT_SELECTOR = ".se-title-text span.__se-node"
BODY_INPUT_SELECTOR = ".se-section-text span.__se-node"
PAYWALL_BUTTON = ".se-paywall-toolbar-button"
NEXT_BUTTON = "#nextBtn"
POPUP_CANCEL_BUTTON = "#localStorageMessageLayerCancelBtn"
TEMPLATE_TOOLBAR_BUTTON = "li.se-toolbar-item.se-toolbar-item-template > button"
MY_TEMPLATES_TAB_BUTTON = ".se-panel-tab-library ul > li:nth-child(3) > button"
TEMPLATE_ITEM_REGULAR = "div.se-tab-content-my-template.se-is-on ul > li:nth-child(1) > a"
TEMPLATE_ITEM_PREMARKET = "div.se-tab-content-my-template.se-is-on ul > li:nth-child(2) > a"
TEMPLATE_OVERWRITE_CONFIRM_BUTTON = "button:has-text('확인'), .se-popup-button-confirm"

# Settings Page Selectors
FREE_GIFT_MODAL_CONFIRM_BUTTON = "div.ant-modal-confirm-btns > button"
CATEGORY_SELECT_BOX = "div.item-category .ant-select-selector"
CATEGORY_OPTION_REGULAR = "div.rc-virtual-list-holder div.ant-select-item-option-selected"
CATEGORY_OPTION_PREMARKET = "div.rc-virtual-list-holder > div > div > div:nth-child(4)"
PUBLISH_BUTTON = "div.buttons > div:nth-child(3) > button"

# Canonical mapping of regular report categories to their English/Korean aliases in templates
CATEGORY_MAP = {
    "Weekly Schedule": ["Weekly Schedule", "주간 일정", "주간일정"],
    "General": ["General", "경제 일반", "경제일반", "뉴스 일반"],
    "Bitcoin": ["Bitcoin", "비트코인"],
    "Semiconductor": ["Semiconductor", "반도체"],
    "AI / Robotics / EV": ["AI / Robotics / EV", "AI / 로봇 / EV", "AI/로봇/EV", "AI/Robotics/EV"],
    "Power / Grid": ["Power / Grid", "Power/Grid", "전력 / 인프라", "전력/인프라", "전력 인프라"],
    "Software": ["Software", "소프트웨어"],
    "Aerospace": ["Aerospace", "우주 항공", "우주항공"],
    "Bio": ["Bio", "바이오"],
    "Consumer / Retail": ["Consumer / Retail", "Consumer/Retail", "소비재 / 리테일", "소비재/리테일", "소비재 리테일"],
    "Others": ["Others", "기타"]
}


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
        # For dynamic parsing, we keep Daily Point in the file but slice before Weekly Schedule here.
        # Daily Point is essentially ignored during regular reports since we start from Weekly Schedule.
        match = re.search(
            r"(###\s+(?:Weekly Schedule|주간 일정))", content, re.IGNORECASE
        )
        if match:
            content = content[match.start() :]

    disclaimer = "\n\n---\n❇︎ 중요 안내사항 ❇︎<br />1. 본 리포트(Alpha Signal)는 투자 판단을 돕기 위한 순수 데이터 제공을 목적으로 하며, 특정 종목에 대한 매수·매도 등 투자 권유나 자문을 의미하지 않습니다.<br />2. 제공되는 모든 내용은 자체 개발한 AI 알고리즘이 미국 시장의 영문 공시 및 뉴스 원문에서 팩트 수치(KPI)만을 기계적으로 추출한 결과물이며, 작성자의 주관적 의견이 배제되어 있습니다.<br />3. 자동화된 시스템을 통한 수집 과정에서 오류, 지연 또는 누락이 발생할 수 있으므로 정보의 완전성을 보장하지 않습니다. 중요한 수치는 반드시 영문 원문을 교차 검증하시기 바랍니다.<br />4. 본 리포트의 데이터를 활용한 모든 투자 판단과 결과에 대한 최종 책임은 전적으로 구독자 본인에게 있습니다.<br />5. 본 채널에서 발행한 모든 콘텐츠는 3개월 경과 후 구독상품에서 제외됩니다.<br />6. 서비스 운영에 관한 질문은 이메일을 통해 문의하여 주시기 바랍니다. 리포트의 해석 또는 투자 판단에 영향을 미치는 문의에는 답변하지 않습니다."

    return content.strip() + disclaimer


def extract_metadata(file_path: str) -> str:
    """Extracts date from filename to generate the title suffix (e.g. ' 7월 12일 알파 시그널')."""
    # Extract date from filename (e.g. 20260712)
    date_match = re.search(r"(\d{4})(\d{2})(\d{2})", file_path)
    if date_match:
        year, month, day = date_match.groups()
        # Strip leading zeros
        month = str(int(month))
        day = str(int(day))
        post_date = f" {month}월 {day}일"
    else:
        post_date = " 알 수 없는 날짜"

    is_korean = "_ko.md" in file_path
    is_premarket = "premarket" in file_path.lower()

    if is_premarket:
        base_title = f"{post_date} 프리마켓"
    else:
        base_title = f"{post_date} 알파 시그널"

    title = base_title if is_korean else f"{base_title} (EN)"

    return title


def markdown_to_naver_html(md_text: str) -> str:
    """Converts markdown to HTML, replacing paragraph tags with double br tags for clean Naver blocks."""
    html = markdown.markdown(md_text, extensions=["tables"])
    
    # Remove outer <p> wrappers and replace paragraph junctions with double breaks
    if html.startswith("<p>") and html.endswith("</p>"):
        html = html[3:-4]
    html = html.replace("</p>\n<p>", "<br /><br />")
    
    # Map <h3> to <h2> because Naver SmartEditor ONE maps <h2> to Heading blocks
    # while <h3> is stripped down to plain text.
    html = html.replace("<h3>", "<h2>").replace("</h3>", "</h2>")
    
    # Inject inline styles to preserve formatting
    # Headings formatting (large, bold, with margins)
    html = html.replace("<h2>", "<h2 style='font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; line-height: 1.4; color: #111111;'>")
    
    # Paragraph formatting (body font size and generous bottom margins for spacing between articles)
    html = html.replace("<p>", "<p style='font-size: 15px; line-height: 1.8; margin-top: 0; margin-bottom: 24px; color: #333333;'>")
    
    # Link formatting
    html = html.replace("<a ", "<a style='color: #0066cc; text-decoration: underline;' ")
    
    return html.strip()


def extract_regular_sections(content: str) -> dict[str, str]:
    """Dynamically splits markdown content by category headers in CATEGORY_MAP."""
    sections = {}
    
    # Flatten all alias names into a single list
    all_aliases = []
    for aliases in CATEGORY_MAP.values():
        all_aliases.extend(aliases)
    escaped_aliases = [re.escape(alias) for alias in all_aliases]
    
    # Match '### Heading Name'
    heading_pattern = r"(?:^|\n)(###\s+(?:" + "|".join(escaped_aliases) + r"))(?=\s|$|\n)"
    matches = list(re.finditer(heading_pattern, content, re.IGNORECASE))
    
    for i, match in enumerate(matches):
        full_header = match.group(1)
        matched_name = re.sub(r"^###\s+", "", full_header).strip()
        
        # Resolve to canonical category key
        category_key = None
        for key, aliases in CATEGORY_MAP.items():
            if any(alias.lower() == matched_name.lower() for alias in aliases):
                category_key = key
                break
                
        if not category_key:
            continue
            
        start_idx = match.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content)
        body = content[start_idx:end_idx].strip()
        
        # Strip disclaimer if last section
        if i + 1 == len(matches):
            disc_idx = body.find("❇︎ 중요 안내사항")
            if disc_idx != -1:
                delim_idx = body.rfind("---", 0, disc_idx)
                body = body[:delim_idx].strip() if delim_idx != -1 else body[:disc_idx].strip()
                
        sections[category_key] = body
        
    return sections


def extract_premarket_sections(content: str) -> dict[str, str]:
    """Splits premarket report content into free and paid parts and strips the disclaimer."""
    parts = [p.strip() for p in content.split("\n\n") if p.strip()]
    sections = {}
    if len(parts) > 0:
        sections["Free"] = parts[0]
    else:
        sections["Free"] = ""
        
    if len(parts) > 1:
        paid_content = "\n\n".join(parts[1:])
        disc_idx = paid_content.find("❇︎ 중요 안내사항")
        if disc_idx != -1:
            delim_idx = paid_content.rfind("---", 0, disc_idx)
            paid_content = paid_content[:delim_idx].strip() if delim_idx != -1 else paid_content[:disc_idx].strip()
        sections["Paid"] = paid_content
    else:
        sections["Paid"] = ""
    return sections


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


def paste_below_heading(page, editor_frame, target_type: str, target_name: str, html_content: str):
    """Finds target heading or paywall in editor, focuses the text block below it, and pastes HTML."""
    print(f"Locating target '{target_name}' ({target_type}) in editor...")
    
    # Map target heading names to lists of potential matching texts in templates
    search_names = [target_name]
    if target_name in CATEGORY_MAP:
        search_names = CATEGORY_MAP[target_name]
    elif target_name == "장전 뉴스":
        search_names = ["장전 뉴스", "장전뉴스"]

    target_idx = editor_frame.evaluate(
        """([type, names]) => {
            const elements = Array.from(document.querySelectorAll('.se-component'));
            
            if (type === 'heading') {
                // Try exact match first to prevent matching articles containing keyword
                let index = elements.findIndex(el => {
                    const text = el.textContent.trim().toLowerCase();
                    return names.some(name => text === name.toLowerCase());
                });
                // Fallback to substring matching if exact match not found
                if (index === -1) {
                    index = elements.findIndex(el => {
                        const text = el.textContent.trim().toLowerCase();
                        return names.some(name => text.includes(name.toLowerCase()));
                    });
                }
                return (index !== -1 && index < elements.length - 1) ? index + 1 : -1;
            } else if (type === 'paywall') {
                const index = elements.findIndex(el => 
                    el.classList.contains('se-component-paywall') || 
                    el.querySelector('[class*="paywall"], .se-paywall-line')
                );
                if (index !== -1 && index < elements.length - 1) {
                    return index + 1;
                }
                return -1;
            }
            return -1;
        }""",
        [target_type, search_names]
    )
    
    if target_idx == -1:
        print(f"Warning: Could not locate block below target '{target_name}' ({target_type}).")
        return
        
    target_block = editor_frame.locator(".se-component").nth(target_idx)
    target_block.wait_for(state="attached", timeout=5000)
    
    # Focus and programmatically collapse cursor range to the start of the targeted block inside iframe
    editor_frame.evaluate(
        """(idx) => {
            const elements = Array.from(document.querySelectorAll('.se-component'));
            const block = elements[idx];
            if (!block) return;
            
            const el = block.querySelector('.se-text-paragraph, p') || block;
            el.focus();
            
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(true); // collapse to start of paragraph
            
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }""",
        target_idx
    )
    page.wait_for_timeout(1000)
    
    # Write to clipboard and paste
    wrapped_html = f"<!DOCTYPE html><html><body><!--StartFragment-->{html_content}<!--EndFragment--></body></html>"
    page.evaluate(
        """async (html) => {
            const blob = new Blob([html], { type: 'text/html' });
            const data = [new ClipboardItem({ 'text/html': blob })];
            await navigator.clipboard.write(data);
        }""",
        wrapped_html
    )
    page.keyboard.press("Meta+V")
    page.wait_for_timeout(1500)


def publish_to_naver(title: str, file_path: str, html_sections: dict[str, str], keep_alive: bool = True):
    """Executes the Playwright publishing flow with template loading and targeted pasting."""
    is_premarket = "premarket" in file_path.lower()

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

            # Wait for editor iframe and construct Frame
            print("Locating editor iframe...")
            try:
                page.wait_for_selector("iframe[src*='editor']", state="attached", timeout=15000)
                # Retrieve actual Frame object (instead of FrameLocator) to support .evaluate()
                editor_frame = page.frame(url=re.compile(r"editor"))
                if not editor_frame:
                    for frame in page.frames:
                        if "editor" in frame.url or "editor" in frame.name:
                            editor_frame = frame
                            break
                if not editor_frame:
                    raise Exception("Could not resolve Frame object from URL/name.")
            except Exception as e:
                print("Failed to locate editor iframe. Operating on main page instead.", e)
                editor_frame = page  # type: ignore

            # Handle temporary save popup (Dismiss if exists)
            print("Checking for temporary save popups...")
            try:
                # Target the specific cancel button ID
                cancel_btn = editor_frame.locator(POPUP_CANCEL_BUTTON).first
                # Wait up to 3 seconds for the popup to appear
                cancel_btn.wait_for(state="visible", timeout=3000)
                cancel_btn.click()
                print("Dismissed temporary save popup.")
                cancel_btn.wait_for(state="detached", timeout=5000)
                page.wait_for_timeout(2000)
            except Exception:
                print("No temporary save popup detected or failed to dismiss.")

            print("Opening template sidebar...")
            try:
                template_btn = editor_frame.locator(TEMPLATE_TOOLBAR_BUTTON).first
                template_btn.wait_for(state="attached", timeout=10000)
                template_btn.click(force=True)
                page.wait_for_timeout(1500)
                
                # Click the "내 템플릿" (My Templates) tab button
                my_templates_tab = editor_frame.locator(MY_TEMPLATES_TAB_BUTTON).first
                my_templates_tab.wait_for(state="visible", timeout=5000)
                my_templates_tab.click(force=True)
                page.wait_for_timeout(1000)
                
                template_sel = (
                    TEMPLATE_ITEM_PREMARKET
                    if is_premarket
                    else TEMPLATE_ITEM_REGULAR
                )
                template_item = editor_frame.locator(template_sel).first
                template_item.wait_for(state="visible", timeout=10000)
                template_item.click(force=True)
                print("Clicked template item. Waiting for template to load...")
                page.wait_for_timeout(4000)
                
                # Check for confirm popup (overwrite template confirm) and accept
                try:
                    confirm_btn = editor_frame.locator(TEMPLATE_OVERWRITE_CONFIRM_BUTTON).first
                    if confirm_btn.count() > 0:
                        confirm_btn.click(timeout=2000)
                        print("Confirmed template load overwrite.")
                        page.wait_for_timeout(2000)
                except Exception:
                    pass
            except Exception as e:
                print("Could not load template:", e)

            print("Entering title...")
            try:
                # 1. Click the title wrapper to initialize editor focus
                editor_frame.locator(".se-title-text").first.click(force=True)
                page.wait_for_timeout(500)

                # 2. Focus the exact contenteditable span
                title_loc = editor_frame.locator(TITLE_INPUT_SELECTOR).first
                title_loc.wait_for(state="attached", timeout=15000)
                
                # 3. Collapse selection caret to the end of the existing text ("2026년")
                title_loc.evaluate(
                    """el => {
                        el.focus();
                        const range = document.createRange();
                        range.selectNodeContents(el);
                        range.collapse(false); // collapse to end
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }"""
                )
                page.wait_for_timeout(500)
                
                # 4. Type the title suffix (e.g. ' 7월 12일 알파 시그널')
                page.keyboard.type(title, delay=100)
            except Exception as e:
                print("Could not enter title. Error:", e)

            # Regular Report vs. Premarket Report Pasting
            if is_premarket:
                # Premarket: Free content below "장전 뉴스", Paid content below the Paywall
                if "Free" in html_sections:
                    paste_below_heading(page, editor_frame, "heading", "장전 뉴스", html_sections["Free"])
                if "Paid" in html_sections:
                    paste_below_heading(page, editor_frame, "paywall", "paywall", html_sections["Paid"])
            else:
                # Regular Report: Loop over CATEGORY_MAP keys to paste in template order
                for category_key in CATEGORY_MAP.keys():
                    if category_key in html_sections:
                        paste_below_heading(page, editor_frame, "heading", category_key, html_sections[category_key])

            print("Clicking next button...")
            try:
                next_loc = editor_frame.locator(NEXT_BUTTON).first
                next_loc.wait_for(state="attached", timeout=5000)
                next_loc.click(force=True)
                page.wait_for_timeout(3000)
                print("Clicked next button. Proceeding to settings page...")
                
                # Dismiss promo modal if it appears
                print("Checking for free gift promotion modal...")
                try:
                    gift_confirm_btn = page.locator(FREE_GIFT_MODAL_CONFIRM_BUTTON).first
                    gift_confirm_btn.wait_for(state="visible", timeout=3000)
                    gift_confirm_btn.click()
                    print("Dismissed free gift promotion modal.")
                    page.wait_for_timeout(2000)
                except Exception:
                    print("No free gift promotion modal detected or failed to dismiss.")
                    
                # Category Selection
                print("Selecting category...")
                try:
                    category_select = page.locator(CATEGORY_SELECT_BOX).first
                    category_select.wait_for(state="visible", timeout=10000)
                    category_select.click()
                    page.wait_for_timeout(1000)
                    
                    if is_premarket:
                        option = page.locator(".ant-select-item-option:has-text('프리마켓')").first
                        if option.count() == 0:
                            option = page.locator(CATEGORY_OPTION_PREMARKET).first
                    else:
                        option = page.locator(".ant-select-item-option:has-text('알파 시그널'), .ant-select-item-option:has-text('알파시그널')").first
                        if option.count() == 0:
                            option = page.locator(CATEGORY_OPTION_REGULAR).first
                            
                    option.wait_for(state="visible", timeout=5000)
                    option.click()
                    print("Selected category successfully.")
                    page.wait_for_timeout(1000)
                except Exception as e:
                    print("Failed to select category:", e)

                # Save state to refresh session
                context.storage_state(path=STATE_FILE)
                print("Session state refreshed successfully.")

                # Locate publish button to verify existence, but DO NOT click (keep commented out as requested)
                print("Locating publish button...")
                publish_btn = page.locator(PUBLISH_BUTTON).first
                publish_btn.wait_for(state="visible", timeout=5000)
                print("Publish button successfully located and verified!")
                # publish_btn.click()  # Kept commented out as requested

                if keep_alive:
                    print("\n============================================================")
                    print("Browser is kept open for manual review/publishing.")
                    print("Press [Enter] in this terminal to close the browser...")
                    print("============================================================\n")
                    input()

            except Exception as e:
                print("Could not click next button or proceed.", e)

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
    
    is_premarket = "premarket" in file_path.lower()
    if is_premarket:
        sections = extract_premarket_sections(raw_body)
    else:
        sections = extract_regular_sections(raw_body)

    # Convert each section's markdown content to HTML
    html_sections = {
        name: markdown_to_naver_html(text) for name, text in sections.items() if text
    }

    publish_to_naver(title, file_path, html_sections, keep_alive=True)


if __name__ == "__main__":
    main()
