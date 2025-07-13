import os
import sys

# Add the project root to the Python path, similar to manage.py
sys.path.append(os.path.join(os.path.dirname(__file__)))

try:
    import apps.pcp.tests
    print(f"Successfully imported apps.pcp.tests")
    print(f"__file__ for apps.pcp.tests: {apps.pcp.tests.__file__}")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")