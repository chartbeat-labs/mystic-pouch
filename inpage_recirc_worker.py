import json
from time import time
import requests
from flask import Flask, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# queries Chartbeat APIs every 60 seconds
stored_result = {}
stored_result_time = {}
storage_time = 60

BASE_REQUEST = 'http://api.chartbeat.com/live/toppages/v3/?apikey={apikey}&host={host}&limit={limit}'
APIKEY = 'YOUR_API_KEY'
LIMIT = 200

@app.route("/<path:filename>")
def host_file(filename):
    '''
    hosts up javascript files in this file
    '''
    return send_from_directory('', filename)

@app.route("/")
def hello():
    '''
    data cacheing layer
    check age of result, if older than specified duration, then get new one.
    in this case the duration of the cache is 60 seconds
    '''

    domain = request.args.get('domain')

    if domain in stored_result_time and (stored_result_time[domain] + storage_time > time()):
        pages = stored_result[domain]
        return json.dumps(pages)

    else:
        pages = request_pages_from_domain(domain)
        stored_result[domain] = pages
        stored_result_time[domain] = time()
        return json.dumps(pages)

# INSERT YOUR API KEY into the request to our toppages API
def request_pages_from_domain(domain):
    assert APIKEY #APIKEY must be filled in
    request_url = BASE_REQUEST.format(apikey=APIKEY, host=domain, limit=LIMIT)
    page_data = requests.get(request_url)
    pages = page_data.json()
    return pages

def sort_by_total_engaged_time(pages):
    '''
    sorts the resulting data object on concurrents * engaged time.
    this can manipulate the object in any way you want: just change the
    sorted_pages values.

    Args:
        pages: dictionary of page data objects from toppages api request

    Returns:
        sorted_pages: same dictionary of page data objects sorted by
        page['stats']['people']*page['stats']['engaged_time']['avg']
        reverse = true as to get the highest value at the top.
    '''
    sorted_pages = sorted(pages['pages'], key=lambda page: page['stats']['people']*page['stats']['engaged_time']['avg'], reverse=True)
    return sorted_pages

if __name__ == "__main__":
    app.run(debug=True, port=8000)
