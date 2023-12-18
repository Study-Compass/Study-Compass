# ==============================================================================
# code adapted from https://github.com/quacs/quacs/blob/master/scrapers/sis_scraper/main.py
# ==============================================================================
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



async def main():
    term = "202101"
    soup = await get_course_ids(term)
    print(soup)

if __name__ == "__main__":
    asyncio.run(main())