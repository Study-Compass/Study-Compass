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


# collectionName should be a string, attribute should be an object like { 'username' : '' }
def addNewField(collectionName, attribute):
    load_dotenv() # loading .env file
    uri = os.environ.get('MONGO_URL') # fetching URI string
    client = MongoClient(uri, server_api=ServerApi('1')) 
    try: # send a ping to confirm a successful connection
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    db = client['studycompass']
    collection = db[collectionName]
    result = collection.update_many(
        {},
        {
            '$set': attribute,
        }
    )

    print(f'Number of documents updated: {result.modified_count}')

def ping():
    load_dotenv() # loading .env file
    uri = os.environ.get('MONGO_URL1') # fetching URI string
    client = MongoClient(uri, server_api=ServerApi('1')) 
    try: # send a ping to confirm a successful connection
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)


def write_items_with_root_image_to_file(file_path):
    """
    Connects to the MongoDB, iterates through the 'classrooms' collection,
    and writes the names of items with image attribute set to '/' to a text file.

    Parameters:
    db_uri (str): MongoDB URI for connecting to the database.
    file_path (str): Path to the output text file.
    """
    # Connect to the MongoDB database
    uri = os.environ.get('MONGO_URL1') # fetching URI string
    client = MongoClient(uri, server_api=ServerApi('1')) 
    try: # send a ping to confirm a successful connection
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    db = client['studycompass']
    collection = db['classrooms1']

    names=[]

    # Open the file in write mode
    for item in collection.find({'image': '/'}):
        # Check if the 'name' attribute exists and add it to the list
        if 'name' in item:
            names.append(item['name'])

    # Sort the names list
    names.sort()

    # Open the file in write mode and write the sorted names
    with open(file_path, 'w') as file:
        for name in names:
            file.write(name + '\n')

    # Close the database connection
    client.close()
    print(f'Sorted items with image attribute set to "/" have been written to {file_path}')


    # Close the database connection
    client.close()
    print(f'Items with image attribute set to "/" have been written to {file_path}')

def replaceImage():
    load_dotenv() # loading .env file
    uri = os.environ.get('MONGO_URL') # fetching URI string
    client = MongoClient(uri, server_api=ServerApi('1')) 
    try: # send a ping to confirm a successful connection
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    db = client['studycompass']
    collection = db['classrooms1']

    collection.update_many({'image': '/'},{'$set': {'image': '/classrooms/placeholder.jpg'},})

# write_items_with_root_image_to_file("not-done.txt") # call the function to add new field to the collection
# addNewField('users',{'saved' : []})
# addNewField('classrooms1',{'attributes': []})
# addNewField('users',{'admin': False})
replaceImage() # call the function to add new field to the collection