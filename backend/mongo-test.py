from pymongo.mongo_client import MongoClient
import os
from dotenv import load_dotenv


def test_mongo_insert_and_read():
    load_dotenv()
    # Replace 'your_database' and 'your_collection' with your actual database and collection names
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
    test_document = {"name": "test", "message": "Hello, MngoDB!"}

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

if __name__ == "__main__":
    test_mongo_insert_and_read()
