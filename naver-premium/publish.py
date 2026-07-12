import os
import re
import sys
import markdown
import httpx
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

# --- Selectors for Naver Premium Content ---
# NOTE: These selectors need to be adjusted based on the actual Naver SmartEditor ONE structure.
NEW_POST_URL = "https://studio.premium.naver.com/post/write"
TITLE_INPUT_SELECTOR = "textarea[placeholder*='제목을 입력하세요'], input[placeholder*='제목']"
BODY_INPUT_SELECTOR = ".se-main-container, .se-content"
PUBLISH_PANEL_BUTTON = "button:has-text('발행')"
CONFIRM_PUBLISH_BUTTON = "button:has-text('발행하기')"

STATE_FILE = os.path.join(os.path.dirname(__file__), "state.json")

def generate_meta_desc(content: str, tags_str: str) -> str:
    try:
        topline_match = re.search(
            r"Topline Signals(.*?)(?=Daily Point|$)", content, re.DOTALL | re.IGNORECASE
        )
        if topline_match:
            topline_text = topline_match.group(1).strip()
            bullets = re.findall(r"[-*] \*\*(.*?)\*\*: (.*)", topline_text)
            text_to_summarize = "\n".join([f"- {c}: {t}" for c, t in bullets[:3]])
        else:
            text_to_summarize = content[:1000]

        prompt = f"""
            Task: Based on the extracted Topline Signals, generate a single SEO Meta Description.
            Topline Signals:
            {text_to_summarize}
            Constraints:
            - Length: Strictly between 140 and 160 characters.
            - Format: Return ONLY the description text. No quotes.
        """
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"num_ctx": 2048, "temperature": 0.3, "num_predict": 100},
                },
            )
            response.raise_for_status()
            result = response.json()
            return result["response"].strip().replace('"', "")
    except Exception as e:
        print(f"Ollama generation failed, falling back: {e}")
        return f"Today's market signals on {tags_str}."

def main():
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
    
    is_korean = "_ko.md" in file_path
    
    date_match = re.search(r"##\s+(\d{2}\s+[A-Za-z]+\s+\d{4})", content)
    post_date = date_match.group(1) if date_match else "Unknown Date"

    tags = re.findall(r"[-*]\s+\*\*([^\*]+)\*\*", content)
    tags = tags[:3]
    tags_str = ", ".join(tags)

    if is_korean:
        title = f"{post_date} - 일일 시황 요약 ({tags_str})"
    else:
        title = f"{post_date} - The Daily Tape ({tags_str})"
        
    meta_desc = generate_meta_desc(content, tags_str)

    body_match = re.search(r"###\s+Daily\s+Point(.*)", content, re.DOTALL)
    if body_match:
        raw_body = "### Daily Point\n\n" + body_match.group(1).strip()
    else:
        raw_body = content

    disclaimer = "\n\n---\n*Disclaimer: 본 발행물은 정보 제공 및 교육용으로만 제공되며 재무, 투자 또는 법률적 조언을 구성하지 않습니다.*" if is_korean else "\n\n---\n*Disclaimer: The information provided is for informational purposes only...*"
    raw_body += disclaimer

    html_content = markdown.markdown(raw_body, extensions=["tables"])
    html_content = html_content.replace("\n", "")

    print(f"Title: {title}")
    print(f"Tags: {tags_str}")

    with Stealth().use_sync(sync_playwright()) as p:
        if not os.path.exists(STATE_FILE):
            print(f"Warning: State file not found at {STATE_FILE}. Please login manually and save state.json.")

        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )

        context_args = {}
        if os.path.exists(STATE_FILE):
            context_args["storage_state"] = STATE_FILE
        context = browser.new_context(**context_args, viewport={"width": 1280, "height": 800})
        
        # Grant clipboard-write permission for the origin
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        
        page = context.new_page()

        try:
            print("Navigating to Naver Premium editor...")
            page.goto(NEW_POST_URL)
            page.wait_for_load_state("networkidle")

            print("Entering title...")
            try:
                page.wait_for_selector(TITLE_INPUT_SELECTOR, state="visible", timeout=15000)
                page.fill(TITLE_INPUT_SELECTOR, title)
            except Exception as e:
                print("Could not find title selector, proceeding anyway. Error:", e)

            print("Writing to clipboard and pasting Rich Text...")
            clipboard_injection_js = f"""
            async () => {{
                const blob = new Blob([`{html_content}`], {{ type: 'text/html' }});
                const data = [new ClipboardItem({{ 'text/html': blob }})];
                await navigator.clipboard.write(data);
            }}
            """
            page.evaluate(clipboard_injection_js)

            # Click body and paste
            try:
                page.wait_for_selector(BODY_INPUT_SELECTOR, state="visible", timeout=15000)
                page.click(BODY_INPUT_SELECTOR)
                page.wait_for_timeout(500)
                page.keyboard.press("Meta+V") # Cmd+V on mac, Ctrl+V on windows
                page.wait_for_timeout(2000)
            except Exception as e:
                print("Failed to paste into body:", e)

            print("Publishing...")
            try:
                page.click(PUBLISH_PANEL_BUTTON)
                page.wait_for_timeout(2000)
                page.click(CONFIRM_PUBLISH_BUTTON)
                page.wait_for_timeout(3000)
                print("Successfully published to Naver Premium!")
            except Exception as e:
                print("Could not complete publish flow automatically:", e)

            if context_args.get("storage_state"):
                context.storage_state(path=STATE_FILE)

        except Exception as e:
            print(f"Failed to publish to Naver Premium: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    main()
