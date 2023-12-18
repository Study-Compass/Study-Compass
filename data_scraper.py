# code adapted from https://github.com/quacs/quacs/blob/master/scrapers/catalog_scraper/main.py

from lxml import html,etree
import requests

URL = "http://rpi.apis.acalog.com/v1/"
KEY = "?key=3eef8a28f26fb2bcc514e6f1938929a1f9317628&format=xml"
CHUNK_SIZE = 100

def get_first_catalog():
    catalog_xml = etree.parse(
        requests.get(
            f"{URL}content{KEY}&method=getCatalogs"
        ).text.encode("utf8"),
        etree.HTMLParser()
    )
    catalog = catalog_xml.xpath("//catalogs/catalog[1]")

    if catalog:
        catalog_id = catalog[0].xpath("@id")[0].split("acalog-catalog-")[1]
        catalog_year = catalog[0].xpath(".//title/text()")[0].split(
            "Rensselaer Catalog "
        )[1]
        return (catalog_year, catalog_id)
    else:
        return None

def get_course_ids(catalog_id):
    courses_xml = html.fromstring(
        requests.get(
            f"{URL}search/courses{KEY}&method=listing&options[limit]=0&catalog={catalog_id}"
        ).text.encode("utf8")
    )
    return courses_xml.xpath("//id/text()")


#curl "http://rpi.apis.acalog.com/v1/content?key=3eef8a28f26fb2bcc514e6f1938929a1f9317628&format=xml&method=getItems&options%5full%5=1&catalog=26&type=courses&ids%5B%5D=64741"
