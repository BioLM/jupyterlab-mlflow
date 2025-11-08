#!/usr/bin/env python3
"""
Diagnostic script for jupyterlab-mlflow server extension
Run this in your JupyterLab environment to diagnose loading issues
"""
import sys
import json
import os

print("=" * 70)
print("jupyterlab-mlflow Server Extension Diagnostic")
print("=" * 70)

# Test 1: Check if package is installed
print("\n1. Package Installation Check")
print("-" * 70)
try:
    import jupyterlab_mlflow
    print(f"✅ Package installed: jupyterlab-mlflow")
    try:
        print(f"   Version: {jupyterlab_mlflow.__version__}")
    except:
        print("   ⚠️  Version not available")
except ImportError as e:
    print(f"❌ Package NOT installed: {e}")
    print("\n   Solution: Install with 'pip install jupyterlab-mlflow'")
    sys.exit(1)

# Test 2: Check entry points
print("\n2. Entry Point Discovery")
print("-" * 70)
try:
    from importlib.metadata import entry_points
    try:
        eps = entry_points(group='jupyter_server.server_extensions')
    except TypeError:
        eps_dict = entry_points()
        eps = list(eps_dict.get('jupyter_server.server_extensions', []))
    
    mlflow_eps = [ep for ep in eps if 'mlflow' in ep.name]
    if mlflow_eps:
        print(f"✅ Found {len(mlflow_eps)} entry point(s):")
        for ep in mlflow_eps:
            print(f"   - {ep.name}: {ep.module}")
    else:
        print("❌ No entry points found")
        print("\n   This means Jupyter Server won't auto-discover the extension.")
        print("   Solution: Check that the package was installed from PyPI wheel")
except Exception as e:
    print(f"⚠️  Error checking entry points: {e}")

# Test 3: Check config files
print("\n3. Configuration Files")
print("-" * 70)
config_paths = [
    os.path.expanduser("~/.jupyter/jupyter_lab_config.d/jupyterlab-mlflow.json"),
    os.path.expanduser("~/.jupyter/jupyter_notebook_config.d/jupyterlab-mlflow.json"),
    "/etc/jupyter/jupyter_lab_config.d/jupyterlab-mlflow.json",
    "/etc/jupyter/jupyter_notebook_config.d/jupyterlab-mlflow.json",
    "/usr/local/etc/jupyter/jupyter_lab_config.d/jupyterlab-mlflow.json",
    "/usr/local/etc/jupyter/jupyter_notebook_config.d/jupyterlab-mlflow.json",
]

found_configs = []
for path in config_paths:
    if os.path.exists(path):
        found_configs.append(path)
        try:
            with open(path) as f:
                config = json.load(f)
            print(f"✅ Found: {path}")
            print(f"   Content: {json.dumps(config, indent=2)}")
        except Exception as e:
            print(f"⚠️  Found but error reading {path}: {e}")

if not found_configs:
    print("❌ No config files found")
    print("\n   Config files should be at:")
    print("   - ~/.jupyter/jupyter_lab_config.d/jupyterlab-mlflow.json")
    print("   - ~/.jupyter/jupyter_notebook_config.d/jupyterlab-mlflow.json")
    print("   - /etc/jupyter/jupyter_lab_config.d/jupyterlab-mlflow.json")
    print("   - /etc/jupyter/jupyter_notebook_config.d/jupyterlab-mlflow.json")
    print("\n   Solution: Reinstall the package or manually create config files")

# Test 4: Test module import
print("\n4. Module Import Test")
print("-" * 70)
try:
    import jupyterlab_mlflow.serverextension
    print("✅ Module imports successfully")
    
    # Check if functions exist
    checks = [
        ('_load_jupyter_server_extension', '_load_jupyter_server_extension'),
        ('_jupyter_server_extension_points', '_jupyter_server_extension_points'),
        ('_jupyter_server_extension_paths', '_jupyter_server_extension_paths'),
    ]
    for name, func_name in checks:
        if hasattr(jupyterlab_mlflow.serverextension, func_name):
            print(f"✅ {name} exists")
        else:
            print(f"❌ {name} missing")
except Exception as e:
    print(f"❌ Module import failed: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Test package-level import
print("\n5. Package-Level Import Test")
print("-" * 70)
try:
    import jupyterlab_mlflow
    print("✅ Package imports successfully")
    
    if hasattr(jupyterlab_mlflow, '_load_jupyter_server_extension'):
        print("✅ Package-level _load_jupyter_server_extension exists")
    else:
        print("❌ Package-level _load_jupyter_server_extension missing")
        
    if hasattr(jupyterlab_mlflow, '_jupyter_server_extension_points'):
        print("✅ Package-level _jupyter_server_extension_points exists")
    else:
        print("❌ Package-level _jupyter_server_extension_points missing")
except Exception as e:
    print(f"❌ Package import failed: {e}")

# Test 6: Check if extension is enabled
print("\n6. Extension Status Check")
print("-" * 70)
try:
    import subprocess
    result = subprocess.run(
        ['jupyter', 'server', 'extension', 'list'],
        capture_output=True,
        text=True,
        timeout=10
    )
    if 'jupyterlab_mlflow' in result.stdout:
        if 'enabled' in result.stdout.lower():
            print("✅ Extension is listed and enabled")
        else:
            print("⚠️  Extension is listed but may not be enabled")
        print(f"\n   Output:\n{result.stdout}")
    else:
        print("❌ Extension not found in 'jupyter server extension list'")
        print("\n   Solution: Enable with:")
        print("   jupyter server extension enable jupyterlab_mlflow.serverextension")
except FileNotFoundError:
    print("⚠️  'jupyter' command not found in PATH")
except Exception as e:
    print(f"⚠️  Error checking extension status: {e}")

# Test 7: Test handler registration (if we can create a mock server)
print("\n7. Handler Registration Test")
print("-" * 70)
try:
    class MockServerApp:
        class MockWebApp:
            def __init__(self):
                self.settings = {'base_url': '/jupyter/'}
                self.handlers = []
            def add_handlers(self, pattern, handlers):
                self.handlers.extend(handlers)
        
        def __init__(self):
            self.web_app = self.MockWebApp()
            self.log = type('Log', (), {
                'info': lambda self, msg: None,
                'error': lambda self, msg: print(f"   LOG ERROR: {msg}")
            })()
    
    mock_app = MockServerApp()
    jupyterlab_mlflow.serverextension._load_jupyter_server_extension(mock_app)
    print(f"✅ Handler registration works")
    print(f"   Registered {len(mock_app.web_app.handlers)} handlers")
    if len(mock_app.web_app.handlers) > 0:
        print("   ✅ Extension can register handlers")
    else:
        print("   ❌ No handlers registered")
except Exception as e:
    print(f"❌ Handler registration failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("Diagnostic Complete!")
print("=" * 70)
print("\nNext Steps:")
print("1. If entry points are missing: Reinstall the package")
print("2. If config files are missing: Reinstall or manually create them")
print("3. If extension is not enabled: Run 'jupyter server extension enable jupyterlab_mlflow.serverextension'")
print("4. Check JupyterLab server logs for extension loading messages")
print("5. Try accessing /mlflow/api/health endpoint to verify handlers are registered")

