from pymongo.mongo_client import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime


def test_mongo_insert_and_read(delete=False):
    load_dotenv()
    database_name = 'studycompass'
    collection_name = 'classrooms'

    # MongoDB URI - make sure this is set correctly in your environment variables
    uri = os.environ.get('MONGO_URL')
    print(uri)
    # Create a MongoClient
    client = MongoClient(uri)
    
    # Access the database and collection
    db = client[database_name]
    collection = db[collection_name]

    # Document to insert
    test_document = {"name": "test", "message": "Hello, MongoDB!"}

    # Insert the document
    try:
        insert_result = collection.insert_one(test_document)
        print(f"Document inserted successfully. ID: {insert_result.inserted_id}")
    except Exception as e:
        print(f"Error during insertion: {e}")
        return

    # Read back the inserted document
    try:
        retrieved_document = collection.find_one({"_id": insert_result.inserted_id})
        print("Retrieved Document:", retrieved_document)
    except Exception as e:
        print(f"Error during retrieval: {e}")

    # delete the inserted document if delete is True
    if delete:
        try:
            delete_result = collection.delete_one({"_id": insert_result.inserted_id})
            if delete_result.deleted_count > 0:
                print("Document deleted successfully.")
            else:
                print("Document not found.")
        except Exception as e:
            print(f"Error during deletion: {e}")

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

# used to convert time from string format (from x:xx pm to military time)
def format_time(time):
    starttime, endtime = [t.strip() for t in time.split('-')]

    # function that converts time from string format (from x:xx pm to military time), also rounds for ease of use
    def convert_to_military_time(time_str):
        time_obj = datetime.strptime(time_str, "%I:%M %p")  # parse the time string

        # extract hours and minutes
        hours, minutes = time_obj.hour, time_obj.minute

        # round minutes to the nearest 30
        rounded_minutes = round(minutes / 30) * 30

        # adjust hours if necessary
        if rounded_minutes >= 60:
            rounded_minutes -= 60
            hours += 1
            # adjust for 24-hour wrap-around
            if hours >= 24:
                hours -= 24

        # create new time object with adjusted time
        rounded_time_obj = time_obj.replace(hour=hours, minute=rounded_minutes)

        # convert to military format
        military_time = rounded_time_obj.strftime("%H:%M")
        return military_time    
    
    return convert_to_military_time(starttime), convert_to_military_time(endtime)


if __name__ == "__main__":
    test_mongo_insert_and_read()
