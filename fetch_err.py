import urllib.request
import urllib.error
import re

try:
    urllib.request.urlopen('http://127.0.0.1:8000/api/blog/posts/')
except urllib.error.HTTPError as e:
    html = e.read().decode('utf-8')
    match = re.search(r'<textarea id="traceback_area".*?>(.*?)</textarea>', html, re.DOTALL)
    if match:
        print(match.group(1).replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&'))
    else:
        match = re.search(r'<pre class="exception_value">(.*?)</pre>', html, re.DOTALL)
        if match:
            print('Exception:', match.group(1))
        else:
            print("Could not find traceback or exception_value")
