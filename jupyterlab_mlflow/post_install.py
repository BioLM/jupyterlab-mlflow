"""
Post-install hook to auto-enable the server extension
"""
import subprocess
import sys


def enable_server_extension():
    """Enable the server extension after installation"""
    try:
        # Try to enable the extension
        result = subprocess.run(
            [sys.executable, "-m", "jupyter", "server", "extension", "enable", 
             "jupyterlab_mlflow.serverextension", "--sys-prefix"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Server extension enabled successfully")
            return True
        else:
            # Try without --sys-prefix
            result = subprocess.run(
                [sys.executable, "-m", "jupyter", "server", "extension", "enable",
                 "jupyterlab_mlflow.serverextension"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print("✅ Server extension enabled successfully")
                return True
            else:
                print(f"⚠️  Could not enable server extension: {result.stderr}")
                return False
    except Exception as e:
        print(f"⚠️  Error enabling server extension: {e}")
        return False


if __name__ == "__main__":
    enable_server_extension()

