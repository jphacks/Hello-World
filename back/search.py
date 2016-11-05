#coding: utf-8
from google import search
from BeautifulSoup import BeautifulSoup
import urllib
import sys
import requests
import json

def search_with_google(lang, code, data):
    """
    search a website with google search engine using code and data
    input:
      - lang: str
      - code: str
      - data: str
    output:
      - target_title: str
      - target_url: str
    """
    data = [line.strip() for line in data.split('\n')]
    error_status = " ".join([sentence for sentence in data if ('Error' in sentence or sentence in code)])
    query = error_status + ' developer'
    
    keyword = lang + " " + query
    target_title, target_url = "", ""
    for url in search(keyword, stop=1, lang="en"):
        soup = BeautifulSoup(urllib.urlopen(url))
        target_title = soup.find("title").text
        target_url = url
        break
    return target_title, target_url

def search_in_stackoverflow(lang, code, data):
    """
    search a stackoverflow page with the API
    input:
      - lang: str
      - code: str
      - data: str
    output:
      - target_title: str
      - target_url: str
    """
    error_status = [sentence for sentence in data.split('\n') if 'Error' in sentence][-1]
    query = [word for word in error_status.split() if word not in code.split()]
    query = ";".join(query)
    errorname = [q for q in query.split(';') if 'Error' in q or 'error' in q]
    lang = data.split()[0]
    
    url = "https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=activity&body={body}&tagged={tags}&title={title}&site=stackoverflow"
    result = requests.get(url.format(body=errorname,tags=lang,title=query)).text
    output = json.loads(result)
    if len(output['items']) > 0:
        target = output['items'][0]
        return target['title'], target['link']
    return None, None

def clean_data(code, data):
    error_status = [sentence for sentence in data.split('\n') if 'Error' in sentence][-1]
    query = [word for word in error_status.split() if word not in code.split()]
    return query

def search_error(code, data):
    """
    input:
      - lang:
      - code: code written by user
      - data: error status by system
    output: 
      - title: Website title
      - url: the URL
    """
    #Google version
    print 'Google'
    title, url = search_with_google(code, data)
    print title, url

    #StackOverFlow version
    print 'StackOverFlow'
    print search_in_stackoverflow(code, data)

    return title, url

def main():
    lang, code, data = sys.argv[1], sys.argv[2], sys.argv[3]
    #search_error(lang, code, data)
    title, url = search_with_google(lang, code, data)
    print title
    print url

if __name__ == '__main__':
    main()
