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
TEMPLATE_ITEM_REGULAR = (
    "div.se-tab-content-my-template.se-is-on ul > li:nth-child(1) > a"
)
TEMPLATE_ITEM_PREMARKET = (
    "div.se-tab-content-my-template.se-is-on ul > li:nth-child(2) > a"
)
TEMPLATE_OVERWRITE_CONFIRM_BUTTON = "button:has-text('확인'), .se-popup-button-confirm"

# Canonical mapping of regular report categories to their English/Korean aliases in templates
CATEGORY_MAP = {
    "Weekly Schedule": ["Weekly Schedule", "주간 일정"],
    "General": ["General", "경제 일반"],
    "Bitcoin": ["Bitcoin", "비트코인"],
    "Semiconductor": ["Semiconductor", "반도체"],
    "AI / Robotics / EV": ["AI / Robotics / EV", "AI / 로봇 / EV"],
    "Power / Grid": ["Power / Grid", "전력 / 인프라"],
    "Software": ["Software", "소프트웨어"],
    "Aerospace": ["Aerospace", "우주 항공"],
    "Bio": ["Bio", "바이오"],
    "Consumer / Retail": ["Consumer / Retail", "소비재 / 리테일"],
    "Others": ["Others", "기타"],
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

    return content.strip()


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
    html = html.replace(
        "<h2>",
        "<h2 style='font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; line-height: 1.4; color: #111111;'>",
    )

    # Paragraph formatting (body font size and generous bottom margins for spacing between articles)
    html = html.replace(
        "<p>",
        "<p style='font-size: 15px; line-height: 1.8; margin-top: 0; margin-bottom: 24px; color: #333333;'>",
    )

    # Link formatting
    html = html.replace(
        "<a ", "<a style='color: #0066cc; text-decoration: underline;' "
    )

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
    heading_pattern = (
        r"(?:^|\n)(###\s+(?:" + "|".join(escaped_aliases) + r"))(?=\s|$|\n)"
    )
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
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        body = content[start_idx:end_idx].strip()

        # Strip disclaimer if last section
        if i + 1 == len(matches):
            disc_idx = body.find("❇︎ 중요 안내사항")
            if disc_idx != -1:
                delim_idx = body.rfind("---", 0, disc_idx)
                body = (
                    body[:delim_idx].strip()
                    if delim_idx != -1
                    else body[:disc_idx].strip()
                )

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
            paid_content = (
                paid_content[:delim_idx].strip()
                if delim_idx != -1
                else paid_content[:disc_idx].strip()
            )
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


def paste_below_heading(
    page, editor_frame, target_type: str, target_name: str, html_content: str
):
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
            const elements = Array.from(document.querySelectorAll('.se-component, .se-text-paragraph'));
            
            if (type === 'heading') {
                const index = elements.findIndex(el => {
                    if (!el.classList.contains('se-text-paragraph')) return false;
                    const text = el.textContent.trim().toLowerCase();
                    return names.some(name => text.includes(name.toLowerCase()));
                });
                return (index !== -1 && index < elements.length - 1) ? index + 1 : -1;
            } else if (type === 'paywall') {
                const index = elements.findIndex(el => 
                    el.classList.contains('se-paywall') || 
                    el.querySelector('[class*="paywall"], .se-paywall-line')
                );
                if (index !== -1) {
                    for (let i = index + 1; i < elements.length; i++) {
                        if (elements[i].classList.contains('se-text-paragraph')) {
                            return i;
                        }
                    }
                }
                return -1;
            }
            return -1;
        }""",
        [target_type, search_names],
    )

    if target_idx == -1:
        print(
            f"Warning: Could not locate block below target '{target_name}' ({target_type})."
        )
        return

    target_block = editor_frame.locator(".se-text-paragraph, .se-component").nth(
        target_idx
    )
    target_block.wait_for(state="attached", timeout=5000)

    # Click to focus
    target_block.click(force=True)
    page.wait_for_timeout(500)

    span_loc = target_block.locator("span.__se-node").first
    span_loc.wait_for(state="attached", timeout=5000)
    span_loc.focus()
    page.wait_for_timeout(1000)

    # Write to clipboard and paste
    wrapped_html = f"<!DOCTYPE html><html><body><!--StartFragment-->{html_content}<!--EndFragment--></body></html>"
    page.evaluate(
        """async (html) => {
            const blob = new Blob([html], { type: 'text/html' });
            const data = [new ClipboardItem({ 'text/html': blob })];
            await navigator.clipboard.write(data);
        }""",
        wrapped_html,
    )
    page.keyboard.press("Meta+V")
    page.wait_for_timeout(1500)


def publish_to_naver(
    title: str, file_path: str, html_sections: dict[str, str], keep_alive: bool = True
):
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
                print(
                    "Could not find or click '텍스트' button. Proceeding anyway. Error:",
                    e,
                )

            # Wait for editor iframe and construct FrameLocator
            print("Locating editor iframe...")
            try:
                page.wait_for_selector(
                    "iframe[src*='editor']", state="attached", timeout=15000
                )
                editor_frame = page.frame_locator("iframe[src*='editor']")
            except Exception as e:
                print(
                    "Failed to locate editor iframe. Operating on main page instead.", e
                )
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
                    TEMPLATE_ITEM_PREMARKET if is_premarket else TEMPLATE_ITEM_REGULAR
                )
                template_item = editor_frame.locator(template_sel).first
                template_item.wait_for(state="visible", timeout=10000)
                template_item.click(force=True)
                print("Clicked template item. Waiting for template to load...")
                page.wait_for_timeout(4000)

                # Check for confirm popup (overwrite template confirm) and accept
                try:
                    confirm_btn = editor_frame.locator(
                        TEMPLATE_OVERWRITE_CONFIRM_BUTTON
                    ).first
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
                title_loc.focus()
                page.wait_for_timeout(500)

                # 3. Clear existing title template placeholder using JavaScript
                title_loc.evaluate("el => el.textContent = ''")
                page.wait_for_timeout(200)

                # 4. Type the new title
                page.keyboard.type(title, delay=100)
            except Exception as e:
                print("Could not enter title. Error:", e)

            if is_premarket:
                # Premarket: Free content below "장전 뉴스", Paid content below the Paywall
                if "Free" in html_sections:
                    paste_below_heading(
                        page,
                        editor_frame,
                        "heading",
                        "장전 뉴스",
                        html_sections["Free"],
                    )
                if "Paid" in html_sections:
                    paste_below_heading(
                        page, editor_frame, "paywall", "paywall", html_sections["Paid"]
                    )
            else:
                # Regular Report: Loop over CATEGORY_MAP keys to paste in template order
                for category_key in CATEGORY_MAP.keys():
                    if category_key in html_sections:
                        paste_below_heading(
                            page,
                            editor_frame,
                            "heading",
                            category_key,
                            html_sections[category_key],
                        )

            print("Clicking next button...")
            try:
                next_loc = editor_frame.locator(NEXT_BUTTON).first
                next_loc.wait_for(state="attached", timeout=5000)
                next_loc.click(force=True)
                page.wait_for_timeout(3000)
                print("Proceeded to next step!")
            except Exception as e:
                print("Could not click next button.", e)

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
