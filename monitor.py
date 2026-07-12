import time
import os
import sys
import json
from pathlib import Path
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Paths
BASE_DIR = Path(__file__).resolve().parent
CORE_DATA_DIR = BASE_DIR.parent / "core" / "data"
STATE_FILE = BASE_DIR / ".publish_state.json"
PUBLISH_SCRIPT = BASE_DIR / "naver-premium" / "publish.py"

def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"published_files": []}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

class ReportHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.state = load_state()

    def process_file(self, filepath: Path):
        filename = filepath.name
        
        # Only process markdown files
        if not filename.endswith(".md"):
            return

        # Check if already published
        if filename in self.state["published_files"]:
            return
            
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Detected new report: {filename}")
        
        # Determine if English or Korean based on naming convention
        # Format: alpha_signal_YYYYMMDD.md / alpha_signal_premarket_YYYYMMDD.md (English)
        # Format: alpha_signal_YYYYMMDD_ko.md / alpha_signal_premarket_YYYYMMDD_ko.md (Korean)
        is_korean = "_ko.md" in filename
        
        if is_korean:
            # If it's Korean, verify that the English counterpart was published first
            english_filename = filename.replace("_ko.md", ".md")
            if english_filename not in self.state["published_files"]:
                print(f"Waiting for English version ({english_filename}) to be published first...")
                return # We will retry or it will be caught later. Wait, actually we shouldn't just drop it.
                # In a real event-driven system, we can queue it or rely on the English version being created first.
                # Since the English version is created first in the requirements, it should already be published.
                # If not, we just skip and let a retry mechanism handle it. For simplicity, we assume English comes first.

        # Run publish script
        print(f"Publishing {filename} to Naver Premium...")
        env = os.environ.copy()
        env["POST_FILE_PATH"] = str(filepath)
        
        try:
            # Use uv to run the script
            result = subprocess.run(
                ["uv", "run", str(PUBLISH_SCRIPT)],
                env=env,
                check=True,
                capture_output=True,
                text=True
            )
            print(f"Successfully published {filename}")
            print(result.stdout)
            
            # Mark as published
            self.state["published_files"].append(filename)
            save_state(self.state)
            
        except subprocess.CalledProcessError as e:
            print(f"Failed to publish {filename}:")
            print(e.stderr)

    def on_created(self, event):
        if not event.is_directory:
            self.process_file(Path(event.src_path))
            
    def on_modified(self, event):
        if not event.is_directory:
            self.process_file(Path(event.src_path))

def main():
    if not CORE_DATA_DIR.exists():
        print(f"Error: {CORE_DATA_DIR} does not exist.")
        sys.exit(1)
        
    print(f"Starting monitor on {CORE_DATA_DIR}...")
    event_handler = ReportHandler()
    observer = Observer()
    observer.schedule(event_handler, str(CORE_DATA_DIR), recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
            
            # Periodically check for any missed files (e.g. Korean files waiting for English)
            # This handles the case where _ko.md was created before .md finished publishing
            state = load_state()
            for path in CORE_DATA_DIR.rglob("*.md"):
                if path.name not in state["published_files"]:
                    is_korean = "_ko.md" in path.name
                    if is_korean:
                        english_filename = path.name.replace("_ko.md", ".md")
                        if english_filename in state["published_files"]:
                            event_handler.process_file(path)
                    else:
                        event_handler.process_file(path)
                        
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
