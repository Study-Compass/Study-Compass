from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

from helpers.datamigration import addNewField, updateVersion


# ============================== starter code ==========================================

VERSION = 1.1 # set version here

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

#get every single user
#remove any special characters and make everything lowercased in the username

client = MongoClient(uri, server_api=ServerApi('1')) 
try: # send a ping to confirm a successful connection
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

# getting relevant collection, clearing data before scanning new
db = client['studycompass']
collection = db['users']
all_users = collection.find({})
# for all users in collection, if collection[all_users] == 
count = 0
for user in all_users:
    username = user["username"]
    filtered_string = ''.join([char for char in username if char.isalnum()])
    if username != filtered_string:
        result = collection.update_one({'_id' : user["_id"]}, {"$set" :{'username': filtered_string}})
        count += 1
print(f"Successfully updated {count} documents!")
