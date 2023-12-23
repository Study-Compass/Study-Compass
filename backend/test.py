import json
import re

def process_json(file_path):
    # Initialize an empty set
    processed_names = set()

    # Open and load the JSON file
    with open(file_path, 'r') as file:
        data = json.load(file)

        # Process each object in the JSON array
        for item in data:
            name = item
            # Remove numbers and whitespace
            clean_name = re.sub(r'[\d\s]', '', name)
            processed_names.add(clean_name)

    return processed_names

# Replace 'classes.json' with the path to your JSON file
# result = process_json('classes.json')
print("hi")