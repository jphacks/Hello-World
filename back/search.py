#coding: utf-8
from google import search
from BeautifulSoup import BeautifulSoup
import urllib
import sys
import requests
import json
import re

def search_with_google(lang, code, data):
    """
    Google検索でエラーから抽出した単語を使って検索し
    上位の結果のタイトルとURLを返す関数
    入力:
      - lang: 言語指定('python'など)
      - code: 実行したときのコード
      - data: エラー出力
    出力: 
      - target_title: タイトル
      - target_url: URL
    """
    #検索用クエリの抽出
    data = [line.strip() for line in data.split('\n')]
    error_status = " ".join([sentence for sentence in data if 'Error' in sentence])
    query = " ".join([word for word in error_status.split() if word not in " ".join(code.split()).split()])

    #エラーの名前の抽出
    error_name = " ".join([word for word in error_status.split() if 'Error' in word])
    error_name = re.sub(r'[!-/:-@[-`{-~]+', '', error_name)

    keyword = lang + " " + query
    target_title, target_url = "", ""
    try:
        for url in search(keyword, stop=1, lang="ja"):
            soup = BeautifulSoup(urllib.urlopen(url))
            target_title = soup.find("title").text
            target_url = url
            if error_name in target_title:
                break
    except Exception as e:
        target_url, target_title = "", ""
    return target_title, target_url

def search_in_stackoverflow(lang, code, data):
    """
    StackOverFlowのAPIでエラーから抽出した単語を使って検索し
    上位の結果のタイトルとURLを返す関数
    入力:
      - lang: 言語指定('python'など)
      - code: 実行したときのコード
      - data: エラー出力
    出力: 
      - target_title: タイトル
      - target_url: URL
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
    入力:
      - lang: 使用言語
      - code: 実行コード
      - data: エラー（システムから返ってきたもの）
    出力: 
      - title: ウェブサイトのタイトル
      - url: そのURL
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
    
    #Google version
    title, url = search_with_google(lang, code, data)
    print title
    print url

if __name__ == '__main__':
    main()
