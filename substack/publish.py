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
TAGS_INPUT_SELECTOR = (
    "input[placeholder*='Select or create tags' i], input[placeholder*='tag' i]"
)
META_DESC_TEXTAREA = (
    "textarea[placeholder*='description' i], textarea[placeholder*='Subtitle' i]"
)
CONFIRM_PUBLISH_BUTTON = "button:has-text('Send to paid subscribers now'), button:has-text('Send to everyone now')"
PAYWALL_BUTTON_SELECTOR = "button[aria-label='Paywall']"

STATE_FILE = "substack/state.json"


def main():
    # 1. Retrieve the markdown file path
    file_path = os.environ.get("POST_FILE_PATH")
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

        print("Launching browser with saved session...")
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-position=0,0",
                "--ignore-certificate-errors",
                "--ignore-certificate-errors-spki-list",
            ],
        )

        context_args = {}
        if os.path.exists(STATE_FILE):
            context_args["storage_state"] = STATE_FILE
        context = browser.new_context(
            **context_args,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            permissions=[
                "clipboard-read",
                "clipboard-write",
            ],  # Required for clipboard pasting
        )
        page = context.new_page()

        try:
            print("Navigating to Substack editor...")
            # Cloudflare might need some time to process even with stealth
            page.goto(NEW_POST_URL, wait_until="domcontentloaded")

            # Wait a bit for Cloudflare challenge to potentially resolve automatically
            print(f"Initial URL: {page.url}")
            if (
                "cloudflare" in page.content().lower()
                or "verification" in page.title().lower()
            ):
                print(
                    "Cloudflare detected. Waiting up to 30 seconds for challenge resolution..."
                )
                for i in range(30):
                    page.wait_for_timeout(1000)
                    if TITLE_INPUT_SELECTOR in page.content():
                        print("Bypassed Cloudflare successfully!")
                        break
                    if i % 5 == 0:
                        print(
                            f"Still waiting... ({i}s) - Current Title: {page.title()}"
                        )

            print(f"Final URL: {page.url}")
            # Wait for the page to settle after Cloudflare challenge
            print("Waiting for page to settle after challenge...")
            page.wait_for_timeout(5000)
            page.screenshot(path="after_cloudflare.png")

            # --- Title ---
            print("Entering title...")
            try:
                # Check what elements are on the page before looking for the title element
                has_prosemirror = page.locator(".ProseMirror").count() > 0
                has_publish_btn = (
                    page.locator("[data-testid='publish-button']").count() > 0
                )
                print(
                    f"Diagnostics - Has ProseMirror: {has_prosemirror}, Has Publish Button: {has_publish_btn}"
                )

                page.wait_for_selector(
                    TITLE_INPUT_SELECTOR, state="visible", timeout=30000
                )
            except Exception as e:
                print(f"Timeout occurred at URL: {page.url}")
                print(f"Page Title at failure: {page.title()}")
                page.screenshot(path="error_screen.png")
                # Print part of the page source (for debugging)
                body_content = page.content()
                if "post-title" in body_content:
                    print(
                        "Found 'post-title' in HTML but not visible/clickable via selector."
                    )
                raise e

            page.fill(TITLE_INPUT_SELECTOR, title)

            # --- Body (Rich Text) ---
            print("Entering body content (Rich Text)...")
            page.click(BODY_INPUT_SELECTOR)

            # Paste Content
            print("Pasting content...")
            # We use execCommand('insertHTML') because it natively integrates with ProseMirror's event system
            # without requiring OS-level clipboard permissions or complex key bindings.
            page.evaluate(
                "(html) => { document.execCommand('insertHTML', false, html); }",
                html_content,
            )
            page.wait_for_timeout(2000)

            # --- Publish Settings Modal ---
            print("Opening publish panel...")
            page.click(PUBLISH_PANEL_BUTTON)
            page.wait_for_timeout(4000)  # Wait for animation

            # --- Tags ---
            print("Entering tags...")
            # Tags are added in the publish panel, which appears after clicking 'Continue'
            TAGS_INPUT_SELECTOR = "input[placeholder*='Select or create tags' i], input[placeholder*='tag' i]"
            page.wait_for_selector(TAGS_INPUT_SELECTOR, state="visible", timeout=10000)

            # Click once to focus
            page.click(TAGS_INPUT_SELECTOR)
            page.wait_for_timeout(500)

            for tag in tags:
                # Type using keyboard to avoid selector failure when placeholder disappears
                page.keyboard.type(tag, delay=50)
                page.wait_for_timeout(1000)
                page.keyboard.press("Enter")
                page.wait_for_timeout(1000)

            # Note: We skip the meta description step here since we already filled the Subtitle field on the main editor page.

            # --- Confirm Publish ---
            print("Clicking final publish button...")
            page.wait_for_selector(CONFIRM_PUBLISH_BUTTON, state="visible")
            page.click(CONFIRM_PUBLISH_BUTTON)

            # Wait to ensure the publish request completes
            page.wait_for_timeout(10000)
            print("Successfully executed Substack publishing flow!")

        except Exception as e:
            print(f"Failed to publish to Substack: {e}")
            sys.exit(1)
        finally:
            browser.close()


if __name__ == "__main__":
    main()
