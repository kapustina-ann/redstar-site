"""Notify Yandex of changed production URLs: python deploy/indexnow.py URL [URL ...].
Use --sitemap only for a whole-site migration, not for routine unchanged releases.
The verification key is intentionally public. Run after production deployment.
"""
import argparse
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

HOST = "redstaragency.ru"
BASE = "https://" + HOST
KEY_URL = BASE + "/indexnow-key.txt"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("urls", nargs="*")
    parser.add_argument("--sitemap", action="store_true")
    args = parser.parse_args()
    urls = args.urls
    if args.sitemap:
        with urllib.request.urlopen(BASE + "/sitemap.xml", timeout=30) as response:
            root = ET.fromstring(response.read())
        urls += [e.text for e in root.iter() if e.tag.endswith("}loc")]
    urls = list(dict.fromkeys(urls))
    if not urls or len(urls) > 10000:
        parser.error("Provide between 1 and 10000 changed URLs")
    if any(urllib.parse.urlsplit(u).netloc != HOST or urllib.parse.urlsplit(u).scheme != "https" for u in urls):
        parser.error("Only HTTPS URLs on redstaragency.ru are allowed")
    with urllib.request.urlopen(KEY_URL, timeout=30) as response:
        key = response.read().decode("utf-8").strip()
    if not (8 <= len(key) <= 128 and key.isalnum()):
        raise ValueError("Invalid public verification key")
    body = json.dumps({"host": HOST, "key": key, "keyLocation": KEY_URL, "urlList": urls}).encode()
    request = urllib.request.Request("https://yandex.com/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(request, timeout=60) as response:
        print("IndexNow HTTP", response.status, "URLs:", len(urls))
        print(response.read().decode("utf-8"))
    print("Submission does not guarantee indexing.")

if __name__ == "__main__":
    main()
