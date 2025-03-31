from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

from helpers.datamigration import forceUpdate, updateVersion


# ============================== starter code ==========================================

VERSION = 1.14 # set version here

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

forceUpdate('events', {'contact' : 'jbliu88@gmail.com'})

updateVersion(uri, VERSION)