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
from dotenv import load_dotenv

from helpers import test_mongo_insert_and_read, print_url, format_time

TIMEOUT = httpx.Timeout(30.0)

date = None # global variable for next date
# function that returns a list of course ids for a given term, searches the sis catalog search, which has each course id as an option value in the selct
async def get_course_ids(term):
    url = f"https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in={term}&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr="
    
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # scraping using bs4
        response = await client.get(url) 
        soup = BeautifulSoup(response.content, 'html.parser') 
        
        select_element = soup.find('select') # find the course select
        # extract course id (example ADMN) values from each <option>
        option_values = [option['value'] for option in select_element.find_all('option') if option.has_attr('value')]
        return option_values



def getMeetingDays(meetings):
    days=[]
    if meetings['meetsSaturday']:
        print('class meets on saturday')
    if meetings['meetsMonday']:
        days.append("M")
    if meetings['meetsTuesday']:
        days.append("T")
    if meetings['meetsWednesday']:
        days.append("W")
    if meetings['meetsThursday']:
        days.append("R")
    if meetings['meetsFriday']:
        days.append("F")
    if meetings['meetsSunday']:
        print('class meets on sunday')
    return days

def checkMultipleMeetings(meetings):
    meeting = None
    for meeting in meetings:
        newMeeting = getMeetingDays(meeting)
        if meeting == None:
            meeting = newMeeting
        elif meeting != newMeeting:
            return False
    return True
        
'''
example
    "AFRICAM 15B": {
        "name": "2025 Spring AFRICAM 15B 001 REC 001",
        "location": {
            "code": "DWINB7",
            "description": "Dwinelle B7"
        },
        "time": [
            "14:00:00",
            "15:59:00"
        ],
        "days": "TuTh"
    },
'''

# function to turn time strings into number of minutes since midnight, rounded to the nearest 15 minutes
# example: "14:00:00" -> 840
def timeToMinutes(time):
    time = datetime.strptime(time, '%H:%M:%S')
    # round to the nearest 15 minutes
    return time.hour * 60 + time.minute


# view-source:https://classes.berkeley.edu/search/class/?f%5B0%5D=im_field_term_name:3153
async def parse_results(dic, pages=1):
    entries = 0
    backoff_factor = 1.0  # Initial backoff factor
    max_retries = 5  # Maximum number of retries for each request

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for i in range(pages):
            for attempt in range(max_retries):
                try:
                    url = f"https://classes.berkeley.edu/search/class?page={i}&f%5B0%5D=im_field_term_name:3153"
                    response = await client.get(url)
                    if response.status_code == 429:  # Too many requests
                        raise httpx.HTTPStatusError(message="Rate limit exceeded", request=response.request, response=response)
                    soup = BeautifulSoup(response.content, 'html.parser')
                    print('page number: ', i)

                    results = soup.find_all('div', class_="handlebarData")
                    for result in results:
                        entries += 1
                        data_node = result.get('data-node')
                        data_json = json.loads(result.get('data-json'))
                        data_node_json = json.loads(data_node)
                        name = data_node_json['nodeURL']
                        if not data_json.get('meetings'):
                            print('no meetings found :(')
                            continue
                        if data_json['instructionMode']['code'] == 'P' and data_json['meetings'][0]["location"] != []:  # Only in-person classes
                            # classroom_info = {
                            #     "name": data_json['displayName'],
                            #     "location": data_json['meetings'][0]["location"],
                            #     "time": [
                            #         timeToMinutes(data_json['meetings'][0]["startTime"]),
                            #         timeToMinutes(data_json['meetings'][0]["endTime"]),
                            #     ],
                            #     "days": getMeetingDays(data_json['meetings'][0]),
                            # }
                            for i in range(len(data_json['meetings'])):
                                
                                course_name = data_json['displayName'].split(' ')[2] + ' ' + data_json['displayName'].split(' ')[3]
                                if type(data_json['meetings'][i]["location"]) == list:
                                    print('location is a list')
                                    print(data_json['meetings'][i]["location"])
                                    continue
                                location = data_json['meetings'][i]["location"]["description"]

                                classroom_info = {
                                    "class_name" : course_name,
                                    "start_time" : timeToMinutes(data_json['meetings'][i]["startTime"]),
                                    "end_time" : timeToMinutes(data_json['meetings'][i]["endTime"]),
                                }
                                
                                if location not in dic:
                                    dic[location] = {
                                        "name": location,
                                        "weekly_schedule": {"M": [], "T": [], "W": [], "R": [], "F": []}
                                    }

                                for day in getMeetingDays(data_json['meetings'][i]):
                                    dic[location]["weekly_schedule"][day].append(classroom_info)


                            if len(data_json['meetings']) > 1:
                                if not checkMultipleMeetings(data_json['meetings']):
                                    print('multiple meetings not matching :(')
                                    for meeting in data_json['meetings']:
                                        print(getMeetingDays(meeting))
                    break  # If successful, break out of the retry loop
                except (httpx.ReadTimeout, httpx.HTTPStatusError) as e:
                    wait = (2 ** attempt) * backoff_factor + random.uniform(0, 1)  # Exponential backoff + jitter
                    print(f"Request failed: {e}. Retrying in {wait:.2f} seconds...")
                    await asyncio.sleep(wait)
                except Exception as e:
                    print(f"An unexpected error occurred: {e}")
                    print('full error: ', e, 'on line' , e.__traceback__.tb_lineno)
                    break  # Break the loop on unknown errors

        # Print the number of entries found
        print(entries, "classes found")
# function to connect and update connected mongo database, in progress until real-
# cluster organization and database management determined
def upload_to_mongo(dic, term):
    load_dotenv() # loading .env file
    uri = os.environ.get('MONGO_URL') # fetching URI string
    client = MongoClient(uri, server_api=ServerApi('1')) 
    try: # send a ping to confirm a successful connection
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    # getting relevant collection, clearing data before scanning new
    db = client['studycompass']
    collection = db['classrooms']
    db['classrooms'].drop()
    
    if date: # if date has been found
        dateCollection = db['date']
        result = dateCollection.find_one({"semester": date})
        if not result:
            dateCollection.insert_one({"semester": date})
    else:
        print("date not found")

    # inserting data into db
    for classroom in dic:
        collection.insert_one(dic[classroom])

# function for dumping data into json file
def dump_to_json(dic):
    with open('classes.json', 'w') as json_file:
        json.dump(dic, json_file, indent=4)
    print("dumped to json")

# main function, term determinance feature on the way
async def main():
    term = "202405"
    dic= {}

    await parse_results(dic, 355)

    # upload data
    dump_to_json(dic)

    return dic

if __name__ == "__main__":
    start_time = time.perf_counter() # establishing start time for benchmarking

    asyncio.run(main())# <-- where the magic happens

    end_time = time.perf_counter() # end time

    # calculating and formatting elapsed time
    elapsed_time_seconds = end_time - start_time 
    minutes = int(elapsed_time_seconds // 60)
    seconds = int(elapsed_time_seconds % 60)
    print(f"The function took {minutes} minutes and {seconds} seconds to complete.")
