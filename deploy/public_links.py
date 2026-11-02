"""Prepare extensionless links in the isolated public release, not the preview."""
import re
import sys
from pathlib import Path

def prepare(folder):
    pages = {p.stem for p in folder.glob('*.html') if not p.name.startswith('yandex_')}
    aliases = {'index': '', 'blog': 'zhurnal', 'keys-psm': 'keysy', 'keys-podmoskovie': 'keys-fid-vrachey'}
    names = '|'.join(map(re.escape, sorted(pages, key=len, reverse=True)))
    # Match only this site's absolute URLs or standalone relative URL values.
    pattern = re.compile(r'(?P<base>https://redstar\.agency/|(?<=["\'=])/?)(?P<name>'+names+r')\.html(?=[?#"\'<>\s]|$)')
    def clean(match):
        name = aliases.get(match['name'], match['name'])
        return (match['base'] or '/') + name
    for path in folder.glob('*.html'):
        if path.stem not in pages:
            continue
        source = path.read_text(encoding='utf-8')
        path.write_text(pattern.sub(clean, source), encoding='utf-8')

if __name__ == '__main__':
    prepare(Path(sys.argv[1]))
