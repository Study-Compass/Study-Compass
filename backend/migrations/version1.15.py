from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

from helpers.datamigration import forceUpdate, updateVersion


# ============================== starter code ==========================================

VERSION = 1.15 # set version here

load_dotenv()
uri = os.environ.get('MONGO_URL_LOCAL')
database = input("Indicate which database you would like to update (d for development or p for production): ").strip()
if(database == "d"):
    pass
elif (database == "p"):
    sure = input("WARNING: This will effect a production database, type 'studycompass' to proceed: ").strip()
    if(sure.lower() == 'studycompass'):
        uri = os.environ.get('MONGO_URL')
    else:
        exit(1)
else: 
    print(f"Improper usage: invalid input {database}")

# =====================================================================================

client = MongoClient(uri)  
db = client['studycompass']

events_collection = db['events']
statuses_collection = db['OIEStatuses']

# Iterate through each event in the events collection
for event in events_collection.find():
    # Assuming the event document has an "_id" field that needs to be referenced
    event_id = event['_id']

    # Search for a status that references this event ID
    status = statuses_collection.find_one({'eventRef': event_id})

    if status:
        # If a status is found, update the event's 'reference' field with the status's ID
        status_id = status['_id']
        events_collection.update_one(
            {'_id': event_id},
            {'$set': {'OIEReference': status_id}}
        )
        print(f"Updated event {event_id} with reference to status {status_id}")
    else:
        print(f"No corresponding status found for event {event_id}")

print("Processing complete.")

updateVersion(uri, VERSION)