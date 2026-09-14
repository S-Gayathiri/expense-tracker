import os
import sys

# Add api directory to sys.path so sibling modules (sheets_service, main, etc.) resolve cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from main import app
