from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

from helpers.datamigration import addNewField, updateVersion


# ============================== starter code ==========================================

VERSION = 1.8 # set version here

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

# updating friends count to accurate value
client = MongoClient(uri, server_api=ServerApi(version='1'))
db = client["studycompass"]
userscollection = db["users"]
friendships = db["friendships"]
users = userscollection.find()
ratings = db["ratings"]

for user in users:
    user_id = user["_id"]
    # find friendship where user_id is requester or recipient
    count = friendships.count_documents({
        "$or": [
            {"requester": user_id, "status": "accepted"},
            {"recipient": user_id, "status": "accepted"}
        ]
    })
    # update user document directly
    userscollection.update_one({"_id": user_id}, {"$set": {"parnters": count}})
    count = ratings.count_documents({"user_id": user_id})
    # update user document directly
    userscollection.update_one({"_id": user_id}, {"$set": {"contributions": count}})



# for user in users:
#     user_id = user["_id"]
#     # find ratings where user_id is user_id
#     count = ratings.count_documents({"user_id": user_id})
#     print(count)
#     # update user document directly
#     userscollection.update_one({"_id": user_id}, {"$set": {"contributions": count}})
    



updateVersion(uri, VERSION)