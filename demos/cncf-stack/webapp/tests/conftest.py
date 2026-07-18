import os
import sys

# Make the webapp package (app.py) importable when running pytest from anywhere.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
