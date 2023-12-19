# =========================================================================================

# code adapted from https://github.com/quacs/quacs/blob/master/scrapers/sis_scraper/main.py

# =========================================================================================
from bs4 import BeautifulSoup
import requests
import asyncio
import json
import httpx
from datetime import datetime
from datetime import datetime


def format_time(time):
    print(time)
    starttime, endtime = [t.strip() for t in time.split('-')]

    def convert_to_military_time(time_str):
        # Parse the time string using the specified format
        time_obj = datetime.strptime(time_str, "%I:%M %p")
        
        # Convert the time to military format
        military_time = time_obj.strftime("%H:%M")

        return military_time
    
    return convert_to_military_time(starttime), convert_to_military_time(endtime)

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
        course_links = [link.find('a') for link in soup.find_all('td', class_='nttitle')]
        for link in course_links:
            if link is not None and link.has_attr('href'):
                yield f"https://sis.rpi.edu{link['href']}"

async def parse_course_info(url, classroom_info):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        course_name = soup.find('th', class_='ddtitle').text.split('-')[2].strip()
        sections = soup.find_all('table', summary='This table lists the scheduled meeting times and assigned instructors for this class..')
        for section in sections:
            rows = section.find_all('tr')
            for row in rows[1:]:
                print(f'row: {row}')
            for row in rows[1:]:
                cells = row.find_all('td')
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


'''
classroom_data = {
    "classroom_id": "101",
    "location": "Building A",
    "weekly_schedule": {
        "Monday": [
            {"class_name": "Math 101", "start_time": "08:00", "end_time": "09:30"},
            {"class_name": "Physics 201", "start_time": "10:00", "end_time": "11:30"}
            # ... more classes
        ],
        # ... other days
    }
}
'''

async def get_course_info(url):
    classroom_info = {}

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        courses = [link.find('a') for link in soup.find_all('td', class_="ntedefault")]
        for course in courses:
            if course is not None and course.has_attr('href'):
                await parse_course_info(f"https://sis.rpi.edu{course['href']}", classroom_info)
    print(classroom_info)



async def main():
    # term = "202209"
    # soup = await get_course_ids(term)
    # async for link in get_all_courses(term, soup[7]):
    #     print(link)
    #     await get_course_info(link)
    dic = {}
    await parse_course_info("https://sis.rpi.edu/rss/bwckctlg.p_disp_listcrse?term_in=202209&subj_in=BIOL&crse_in=4740&schd_in=L", dic)
    print(dic)

if __name__ == "__main__":
    asyncio.run(main())