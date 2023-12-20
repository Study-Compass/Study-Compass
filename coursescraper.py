# =========================================================================================

# code adapted from https://github.com/quacs/quacs/blob/master/scrapers/sis_scraper/main.py

'''
Term guide:
    First 4 digits represent year, last 2 digits represent term
    01 = Spring
    05 = Summer
    09 = Fall
    Example: 202109 = Fall 2021

How it works:
    1. Get all course ids for a given term using the sis catalog search (refer to get_course_ids())
        Example url: https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in=202109&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=
        The above url gets all course id's for the term 202109 (Fall 2021), example: ADMN
    2. For each course id, get all active courses (courses that are being taught in the term) using the sis catalog (refer to get_all_courses())
        Example url: https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in=202109&call_proc_in=&sel_subj=dummy&sel_levl=dummy&sel_schd=dummy&sel_coll=dummy&sel_divs=dummy&sel_dept=dummy&sel_attr=dummy&sel_subj=ADMN&sel_crse_strt=&sel_crse_end=&sel_title=&sel_levl=%25&sel_schd=%25&sel_coll=%25&sel_divs=%25&sel_dept=%25&sel_from_cred=&sel_to_cred=&sel_attr=%25
        The above url gets all urls for active courses for the term 202109 (Fall 2021) with the course id ADMN, 
        Example result url: https://sis.rpi.edu/rss/bwckctlg.p_disp_listcrse?term_in=202109&subj_in=ADMN&crse_in=1824&schd_in=L
        Is able to do this because only active courses have links in their course information, usually next to Schedule Types: 
    3. For each active course, parse all its information (refer to parse_course_info())
        Example url: https://sis.rpi.edu/rss/bwckctlg.p_disp_listcrse?term_in=202109&subj_in=ADMN&crse_in=1824&schd_in=L
        We only care about the Scheduled Meeting Times table and the name of the course, inserts information into a dictionary
    9. For each day, append class name, start time, and end time to weekly schedule
    10. For each classroom, insert into database
'''

# =========================================================================================
from bs4 import BeautifulSoup
import asyncio
import json
import httpx
from datetime import datetime
import time
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os


TIMEOUT = httpx.Timeout(30.0)

def format_time(time):
    starttime, endtime = [t.strip() for t in time.split('-')]

    def convert_to_military_time(time_str):
        time_obj = datetime.strptime(time_str, "%I:%M %p") # parse the time string using the specified format
        military_time = time_obj.strftime("%H:%M") # convert the time to military format
        return military_time
    
    return convert_to_military_time(starttime), convert_to_military_time(endtime)

# function that returns a list of course ids for a given term, searches the sis catalog search, which has each course id as an option value in the selct
async def get_course_ids(term):
    url = f"https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in={term}&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr="
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        select_element = soup.find('select') # find the course select
        # extract course id (example ADMN) values from each <option>
        option_values = [option['value'] for option in select_element.find_all('option') if option.has_attr('value')]
        return option_values

async def get_all_courses(term, id):
    url = f"https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in={term}&call_proc_in=&sel_subj=dummy&sel_levl=dummy&sel_schd=dummy&sel_coll=dummy&sel_divs=dummy&sel_dept=dummy&sel_attr=dummy&sel_subj={id}&sel_crse_strt=&sel_crse_end=&sel_title=&sel_levl=%25&sel_schd=%25&sel_coll=%25&sel_divs=%25&sel_dept=%25&sel_from_cred=&sel_to_cred=&sel_attr=%25"
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # print(f'scanning url: {url}\n')
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        course_links = [link.find('a') for link in soup.find_all('td', class_='ntdefault')]
        for link in course_links:
            if link is not None and link.has_attr('href') and "crse_in" in link['href']:
                yield f"https://sis.rpi.edu{link['href']}"

async def parse_course_info(url, classroom_info):
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        print_url(url)
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        course_name = soup.find('th', class_='ddtitle').text.split('-')[2].strip()
        sections = soup.find_all('table', summary='This table lists the scheduled meeting times and assigned instructors for this class..')
        for section in sections:
            rows = section.find_all('tr')
            for row in rows[1:]:
                cells = row.find_all('td')
                if "TBA" in cells[1].text or "TBA" in cells[2].text or "TBA" in cells[3].text:
                    continue
                classroom = cells[3].text.strip()
                time = format_time(cells[1].text.strip())
                days = list(cells[2].text.strip())
                if classroom not in classroom_info:
                    classroom_info[classroom] = {
                        "name": classroom,
                        "weekly_schedule": {
                            "M": [],
                            "T": [],
                            "W": [],
                            "R": [],
                            "F": [],
                        }
                    }
                for day in days:
                    classroom_info[classroom]["weekly_schedule"][day].append({"class_name": course_name, "start_time": time[0], "end_time": time[1]})

def print_url(url, full=False):
    if full:
        print(url)
        return
    url = url.split('term_in=')[1]
    term = url[:6]
    year = term[:4]
    url = url.split('&subj_in=')[1]
    id = url[:4]
    url = url.split('&crse_in=')[1]
    course = url[:4]
    if term[4:] == '01':
        term = 'Spring'
    elif term[4:] == '05':
        term = 'Summer'
    elif term[4:] == '09':
        term = 'Fall'
    print(f'scraping {term} {year} {id} {course}')
    

async def main():
    term = "202109"
    dic= {}
    for course in await get_course_ids(term):
        async for link in get_all_courses(term, course):
            await parse_course_info(link, dic)

    # uri = os.environ.get('MONGOURL')
    # client = MongoClient(uri, server_api=ServerApi('1'))
    # try: # Send a ping to confirm a successful connection

    #     client.admin.command('ping')
    #     print("Pinged your deployment. You successfully connected to MongoDB!")
    # except Exception as e:
    #     print(e)

    # db = client['studycompass']
    # collection = db['classrooms']
    
    # for classroom in dic:
    #     collection.insert_one(dic[classroom])

    with open('classes.json', 'w') as json_file:
        json.dump(dic, json_file, indent=4)

    return dic

if __name__ == "__main__":
    start_time = time.perf_counter()
    asyncio.run(main())
    end_time = time.perf_counter()
    elapsed_time_seconds = end_time - start_time
    minutes = int(elapsed_time_seconds // 60)
    seconds = int(elapsed_time_seconds % 60)
    print(f"The function took {minutes} minutes and {seconds} seconds to complete.")