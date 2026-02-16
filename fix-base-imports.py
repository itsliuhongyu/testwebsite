import os
import re

files_to_fix = [
    'src/routes/assembly/candidate/[candidate_id]/+page.svelte',
    'src/routes/congress/candidate/[candidate_id]/+page.svelte',
    'src/routes/senate/candidate/[candidate_id]/+page.svelte',
    'src/routes/wisconsin-governor/[id]/+page.svelte',
    'src/routes/wisconsin-supreme-court/[id]/+page.svelte'
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            lines = f.readlines()
        
        # Remove standalone script block at start if exists
        start_idx = 0
        if len(lines) >= 4 and lines[0].strip() == '<script>' and 'import { base }' in lines[1]:
            start_idx = 4
            lines = lines[start_idx:]
        
        # Find script tag and add base import if not there
        content = ''.join(lines)
        if 'import { base }' not in content:
            for i, line in enumerate(lines):
                if line.strip() == '<script>':
                    lines.insert(i+1, "    import { base } from '$app/paths';\n")
                    break
        
        with open(filepath, 'w') as f:
            f.writelines(lines)
        print(f'Fixed: {filepath}')
