# =========================================================================================

# code adapted from https://github.com/quacs/quacs/blob/master/scrapers/sis_scraper/main.py

# =========================================================================================
from bs4 import BeautifulSoup
import requests
import asyncio
import json
import httpx
from datetime import datetime

# function that returns a list of course ids for a given term, searches the sis catalog search, which has each course id as an option value in the selct
async def get_course_ids(term):
    url = f"https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in={term}&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr="
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        select_element = soup.find('select') # find the course select
        # extract course id (example ADMN) values from each <option>
        option_values = [option['value'] for option in select_element.find_all('option') if option.has_attr('value')]
        return option_values

async def get_all_courses(term, id):
    url = f"https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in={term}&call_proc_in=&sel_subj=dummy&sel_levl=dummy&sel_schd=dummy&sel_coll=dummy&sel_divs=dummy&sel_dept=dummy&sel_attr=dummy&sel_subj={id}&sel_crse_strt=&sel_crse_end=&sel_title=&sel_levl=%25&sel_schd=%25&sel_coll=%25&sel_divs=%25&sel_dept=%25&sel_from_cred=&sel_to_cred=&sel_attr=%25"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        course_links = [link.find('a') for link in soup.findAll('td', class_='nttitle')]
        for link in course_links:
            if link is not None and link.has_attr('href'):
                yield f"https://sis.rpi.edu{link['href']}"

async def get_course_info(url):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        course_info = soup.find('table', class_='datadisplaytable')
        course_title = course_info.find('caption').text
        course_info_rows = course_info.findAll('tr')
        course_info_dict = {}
        for row in course_info_rows:
            row_title = row.find('th').text
            row_data = row.find('td').text
            course_info_dict[row_title] = row_data
        course_info_dict['title'] = course_title
        return course_info_dict

async def main():
    term = "202101"
    soup = await get_course_ids(term)
    async for link in get_all_courses(term, soup[0]):
        print(link)

if __name__ == "__main__":
    asyncio.run(main())