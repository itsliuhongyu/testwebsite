#!/usr/bin/env python3
import os
import re

def fix_svelte_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if file starts with standalone base import script
    if content.startswith('<script>\n    import { base }'):
        # Remove first 4 lines (standalone script block)
        lines = content.split('\n')
        content = '\n'.join(lines[4:])
        
        # Find the main script tag and add base import
        script_match = re.search(r'<script>\n((?:    import .+?\n)+)', content)
        if script_match:
            imports = script_match.group(1)
            if 'import { base }' not in imports:
                new_imports = "    import { base } from '$app/paths';\n" + imports
                content = content.replace(script_match.group(0), f'<script>\n{new_imports}')
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f'Fixed: {filepath}')

# Find all svelte files in routes subdirectories
for root, dirs, files in os.walk('src/routes'):
    for file in files:
        if file.endswith('+page.svelte'):
            filepath = os.path.join(root, file)
            if 'district' in filepath or 'candidate' in filepath or 'wisconsin-' in filepath:
                fix_svelte_file(filepath)
