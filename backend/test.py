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

def process_unique_classes(file_path):
    # Initialize an empty set
    amounts = {}

    # Open and load the JSON file
    with open(file_path, 'r') as file:
        data= json.load(file)
        for item in data:
            data1 = data[item]
            classes = []
            for day in data1['weekly_schedule']:
                for clasS in data1['weekly_schedule'][day]:
                    if clasS["class_name"] not in classes:
                        classes.append(clasS["class_name"])
            if len(classes) > 15:
                print(data1)
            if str(len(classes)) not in amounts:
                amounts[str(len(classes))] = 1
            else:
                amounts[str(len(classes))] += 1 

    return amounts

# Replace 'classes.json' with the path to your JSON file
# result = process_json('classes.json')
result  = process_unique_classes('classes.json')
print(result)