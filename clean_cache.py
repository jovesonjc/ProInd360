import os
import shutil

def clean_directory(path):
    for root, dirs, files in os.walk(path):
        if '__pycache__' in dirs:
            shutil.rmtree(os.path.join(root, '__pycache__'))
            print(f"Removed: {os.path.join(root, '__pycache__')}")
        for file in files:
            if file.endswith('.pyc'):
                os.remove(os.path.join(root, file))
                print(f"Removed: {os.path.join(root, file)}")

if __name__ == "__main__":
    apps_dir = 'apps'
    if os.path.exists(apps_dir):
        clean_directory(apps_dir)
    else:
        print(f"Directory '{apps_dir}' not found.")