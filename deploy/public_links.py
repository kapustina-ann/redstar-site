"""Prepare extensionless links in the isolated public release, not the preview."""
import re
import sys
from pathlib import Path

def prepare(folder):
    # These services remain preview-only until their content is approved.
    for name in ('uslugi-proverka-rkn.html', 'uslugi-obnovlenie-bitrix.html', 'uslugi-razrabotka.html'):
        draft = folder / name
        if draft.exists():
            draft.unlink()
    pages = {p.stem for p in folder.glob('*.html') if not p.name.startswith('yandex_')}
    aliases = {'index': '', 'blog': 'zhurnal', 'keys-psm': 'keysy', 'keys-podmoskovie': 'keys-fid-vrachey'}
    names = '|'.join(map(re.escape, sorted(pages, key=len, reverse=True)))
    # Match only this site's absolute URLs or standalone relative URL values.
    pattern = re.compile(r'(?P<base>https://(?:redstar\.agency|redstaragency\.ru)/|(?<=["\'=])/?)(?P<name>'+names+r')\.html(?=[?#"\'<>\s]|$)')
    def clean(match):
        name = aliases.get(match['name'], match['name'])
        return (match['base'] or '/') + name
    for path in folder.glob('*.html'):
        source = path.read_text(encoding='utf-8')
        # Remove only the preview-specific directive; preserve intentional noindex.
        source = re.sub(r'<meta\b[^>]*data-preview-only="true"[^>]*>\s*', '', source, flags=re.I)
        if path.stem not in pages:
            path.write_text(source, encoding='utf-8')
            continue
        def support_link(match):
            block = match.group(0)
            link = re.search(r'<a\b[^>]*>.*?</a>', block, re.S).group(0)
            description = re.search(r'<span class="support-subnav__description">(.*?)</span>', block, re.S)
            if description:
                link = link.replace('</a>', '<span>' + description[1] + '</span></a>')
            return link
        source = re.sub(r'<div class="support-subnav support-subnav--(?:desktop|mobile)">.*?<div class="support-subnav__panel"[^>]*>.*?</div>\s*</div>', support_link, source, flags=re.S)
        path.write_text(pattern.sub(clean, source), encoding='utf-8')

if __name__ == '__main__':
    prepare(Path(sys.argv[1]))
