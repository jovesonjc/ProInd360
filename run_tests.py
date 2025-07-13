import os
import sys
import django
from django.conf import settings
from django.core.management import call_command

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proindustria360.settings')
django.setup()

if __name__ == '__main__':
    try:
        # Run tests for the 'pcp' app
        call_command('test', 'apps.pcp')
    except Exception as e:
        print(f"An error occurred during testing: {e}")
        sys.exit(1)