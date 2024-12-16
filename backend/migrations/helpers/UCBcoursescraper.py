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



# function that, given a term and a course ID (exmaple: ADMN), searches for all the courses in the term with in that subject
async def get_all_courses(term, id):
    pass


# function that, given a course link, extracts relevant info from meeting times table
async def parse_course_info(url, classroom_info):
    pass

# view-source:https://classes.berkeley.edu/search/class/?f%5B0%5D=im_field_term_name:3153
async def parse_results(dic):
    pages=10
    url = "https://classes.berkeley.edu/search/class/?f%5B0%5D=im_field_term_name:3153"
    
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # scraping using bs4
        response = await client.get(url) 
        soup = BeautifulSoup(response.content, 'html.parser') 
        
        results = soup.find_all('div', class_="handlebarData")
        for result in results:
            data_node = result.get('data-node')
            data_json = json.loads(result.get('data-json'))
            data_node_json =  json.loads(data_node)
            name = data_node_json['nodeURL']
            dic[name] = data_json['meetings']


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

    await parse_results(dic)

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
