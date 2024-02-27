from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

def updateClassroom():
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
    collection1 = db['classrooms1']  
    schedules = db['schedules']


    all_classes = collection.find({})
    for classroom in all_classes:
        classroom1 = {
            'name':classroom['name']
        }
        collection1.insert_one(classroom1)
        newclassroom = collection1.find_one({'name':classroom['name']})
        schedule = {
            'classroom_id':newclassroom['_id'],
            'weekly_schedule':classroom['weekly_schedule']
        }
        schedules.insert_one(schedule)

updateClassroom()


