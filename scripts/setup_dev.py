#!/usr/bin/env python3
"""
Development setup script for JupyterLab MLflow extension
"""
import os
import shutil
import json
from pathlib import Path

def setup_extension():
    """Setup extension for development"""
    base_dir = Path(__file__).parent
    
    # Create labextension directory structure
    labextension_dir = base_dir / "jupyterlab_mlflow" / "labextension"
    labextension_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy lib files
    lib_dir = base_dir / "lib"
    if lib_dir.exists():
        dest_lib = labextension_dir / "lib"
        if dest_lib.exists():
            shutil.rmtree(dest_lib)
        shutil.copytree(lib_dir, dest_lib)
        print(f"✓ Copied lib/ to {dest_lib}")
    
    # Copy style files
    style_dir = base_dir / "style"
    if style_dir.exists():
        dest_style = labextension_dir / "style"
        if dest_style.exists():
            shutil.rmtree(dest_style)
        shutil.copytree(style_dir, dest_style)
        print(f"✓ Copied style/ to {dest_style}")
    
    # Copy schema
    schema_dir = base_dir / "jupyterlab_mlflow" / "schema"
    if schema_dir.exists():
        dest_schema = labextension_dir / "schema"
        if dest_schema.exists():
            shutil.rmtree(dest_schema)
        shutil.copytree(schema_dir, dest_schema)
        print(f"✓ Copied schema/ to {dest_schema}")
    
    # Create package.json for labextension
    package_json = {
        "name": "jupyterlab-mlflow",
        "version": "0.1.0",
        "main": "lib/index.js",
        "types": "lib/index.d.ts",
        "style": "style/index.css",
        "jupyterlab": {
            "extension": True
        }
    }
    
    package_json_path = labextension_dir / "package.json"
    with open(package_json_path, "w") as f:
        json.dump(package_json, f, indent=2)
    print(f"✓ Created {package_json_path}")
    
    # Create install.json
    install_json = {
        "packageManager": "npm",
        "baseUrl": ".",
        "packageDir": ".",
        "uninstall": {
            "packages": ["jupyterlab-mlflow"]
        },
        "install": {
            "packages": ["jupyterlab-mlflow"]
        }
    }
    
    install_json_path = labextension_dir / "install.json"
    with open(install_json_path, "w") as f:
        json.dump(install_json, f, indent=2)
    print(f"✓ Created {install_json_path}")
    
    print("\n✓ Extension setup complete!")
    print("\nNext steps:")
    print("1. Enable server extension:")
    print("   python3 -m jupyter server extension enable jupyterlab_mlflow.serverextension")
    print("2. Start JupyterLab:")
    print("   python3 -m jupyter lab")

if __name__ == "__main__":
    setup_extension()

