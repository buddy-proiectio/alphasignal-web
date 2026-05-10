import os
import re
import sys
import markdown
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# --- Selectors (Updated from actual Substack DOM) ---
NEW_POST_URL = "https://therawtape.substack.com/publish/post"
TITLE_INPUT_SELECTOR = "[data-testid='post-title']"
BODY_INPUT_SELECTOR = ".ProseMirror"
PUBLISH_PANEL_BUTTON = "[data-testid='publish-button']"  # The 'Continue' button
CONFIRM_PUBLISH_BUTTON = "button:has-text('Send to paid subscribers now'), button:has-text('Send to everyone now')"

STATE_FILE = "substack/state.json"


def main():
    # 1. Retrieve the markdown file path
    # file_path = os.environ.get("POST_FILE_PATH") # TODO
    file_path = "./alpha_signal_20260509_test_en.md"
    if not file_path:
        print("Error: POST_FILE_PATH environment variable is not set.")
        sys.exit(1)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        sys.exit(1)

    print(f"Loaded Markdown: {file_path}")

    # 2. Extract Date (e.g. "## 08 May 2026 Alpha Signal" -> "08 May 2026")
    date_match = re.search(r"##\s+(\d{2}\s+[A-Za-z]+\s+\d{4})", content)
    post_date = date_match.group(1) if date_match else "Unknown Date"

    # 3. Extract Topline Signals Tags (e.g. "- **Alphabet**:")
    tags = re.findall(r"-\s+\*\*([^\*]+)\*\*", content)
    # Ensure we limit to 3 tags max based on the requirement
    tags = tags[:3]
    tags_str = ", ".join(tags)

    # 4. Formulate Title and SEO Meta Description
    title = f"{post_date} - The Daily Tape ({tags_str})"
    meta_desc = f"Today's market signals on {tags_str}."[:160]

    # --- Smart Meta Description Generation (No LLM) ---
    topline_match = re.search(
        r"\*\*Topline Signals\*\*\n\n(.*?)\n\n", content, re.DOTALL | re.IGNORECASE
    )
    if topline_match:
        topline_text = topline_match.group(1).strip()
        bullets = re.findall(r"- \*\*(.*?)\*\*: (.*)", topline_text)
        desc_parts = []
        for company, text in bullets[:2]:
            clean_text = re.sub(r"[\*_]", "", text)
            # Find the first sentence (until a period)
            sentence = clean_text.split(".")[0].strip()
            desc_parts.append(f"{company}: {sentence}")
        fallback_desc = " | ".join(desc_parts)
        if fallback_desc:
            if len(fallback_desc) > 155:
                # Truncate elegantly without breaking words
                meta_desc = fallback_desc[:152].rsplit(" ", 1)[0] + "..."
            else:
                meta_desc = fallback_desc

    # 5. Extract Body (From "### Daily Point" to the end)
    body_match = re.search(r"###\s+Daily\s+Point(.*)", content, re.DOTALL)
    if not body_match:
        print("Error: '### Daily Point' not found in markdown.")
        sys.exit(1)

    # Include '### Daily Point' in the content as requested
    raw_body = "### Daily Point\n\n" + body_match.group(1).strip()

    # 6. Append Disclaimer
    disclaimer = "\n\n---\n*Disclaimer: The information provided in this publication is for informational and educational purposes only and does not constitute financial, investment, or legal advice. All data and content are extracted via automated systems and may contain errors, omissions, or delays. All investment decisions are made entirely at your own risk.*"
    raw_body += disclaimer

    # 7. Convert Markdown to HTML (rich text, handling tables)
    html_content = markdown.markdown(raw_body, extensions=["tables"])

    # CRITICAL: Substack's insertHTML treats newlines in the raw HTML string as extra paragraph breaks!
    # We must strip all newlines from the generated HTML so it pastes perfectly without huge gaps.
    html_content = html_content.replace("\n", "")

    print(f"Title: {title}")
    print(f"Tags: {tags_str}")
    print(f"Meta Description: {meta_desc}")

    # 9. Playwright Substack Publishing Flow with Stealth
    with Stealth().use_sync(sync_playwright()) as p:
        if not os.path.exists(STATE_FILE):
            print(
                f"Warning: State file not found at {STATE_FILE}. Make sure the secret is configured correctly."
            )

        print("Launching Chromium in headful mode (via xvfb)...")
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
        )

        context_args = {}
        if os.path.exists(STATE_FILE):
            context_args["storage_state"] = STATE_FILE
        context = browser.new_context(
            **context_args,
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        try:
            print("Navigating to Substack editor...")
            page.goto(NEW_POST_URL)

            # --- Title ---
            print("Entering title...")
            page.wait_for_selector(TITLE_INPUT_SELECTOR, state="visible", timeout=30000)
            page.fill(TITLE_INPUT_SELECTOR, title)

            # --- Body (Rich Text) ---
            print("Entering body content (Rich Text)...")
            page.click(BODY_INPUT_SELECTOR)

            # Paste Content
            print("Pasting content...")
            page.evaluate(
                "(html) => { document.execCommand('insertHTML', false, html); }",
                html_content,
            )
            page.wait_for_timeout(2000)

            # --- Publish Settings Modal ---
            print("Opening publish panel...")
            page.click(PUBLISH_PANEL_BUTTON)
            page.wait_for_timeout(4000)

            # --- Tags ---
            print("Entering tags...")
            TAGS_INPUT_SELECTOR = "input[placeholder*='Select or create tags' i], input[placeholder*='tag' i]"
            page.wait_for_selector(TAGS_INPUT_SELECTOR, state="visible", timeout=10000)
            page.click(TAGS_INPUT_SELECTOR)
            page.wait_for_timeout(500)

            for tag in tags:
                page.keyboard.type(tag, delay=50)
                page.wait_for_timeout(1000)
                page.keyboard.press("Enter")
                page.wait_for_timeout(1000)

            # --- Confirm Publish ---
            print("Clicking final publish button...")
            page.click(CONFIRM_PUBLISH_BUTTON)
            page.wait_for_timeout(5000)

            print("Successfully executed Substack publishing flow!")

            # --- Refresh Session State ---
            # Save the latest session state to the local file to prevent expiration
            context.storage_state(path=STATE_FILE)
            print(f"Session state updated and saved to {STATE_FILE}")

        except Exception as e:
            print(f"Failed to publish to Substack: {e}")
            page.screenshot(path="error_screen.png")
            raise e
        finally:
            browser.close()


if __name__ == "__main__":
    main()
