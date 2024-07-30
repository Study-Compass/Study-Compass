#include <iostream>
#include <string>
#include <cstdlib>
#include <fstream>
#include <cmath>
#include <random>
#include <ctime>
#include <bits/stdc++.h> 
#include "classroom.h"


// List of free classrooms, each one an object, classroom will contain attributes (bool outlets, bool windows, classtype (lecture, lab, classroom), bool printer, tabletype (smalldesk, largedesk, table)), building its in, id
// Given users ordering of which is most important outlets, windows, printer, classtype, tableype (First is most important for ordering)
// All preferences for each atribute
// Users prefered building/null
// Users last 10 studied classrooms (if not 10 return static list)
// Routine vs variety weight (randomness (comment out other solution) 4 most variety (random), 0 least variety)

//preferences[outlets, windows, classtype, printer, tabletype]


struct sort_pred {
    bool operator()(const std::pair<double, Classroom> &left, const std::pair<double, Classroom> &right) {
        return left.first > right.first;
    }
};
struct sort_pred_pair {
    bool operator()(const std::pair<double, std::pair<int, Classroom>> &left, const std::pair<double, std::pair<int, Classroom>> &right) {
        return left.first > right.first;
    }
};


std::vector<std::pair<double, std::pair<int, Classroom>>>  imp(std::vector<Classroom> free, std::string order[], std::string preferences[], std::string building, Classroom previous[], int variety){
	Classroom best(preferences[0]=="true", preferences[1]=="true", preferences[2], preferences[3]=="true", preferences[4], building, 0);
	// if (previous.size()!=10)
	// 	return std::vector<Classroom>;
	double outletWeight=0;
	double windowWeight=0;
	double classWeight=0;
	double printerWeight=0;
	double tableWeight=0;
	double buildingWeight=1;
	std::vector<std::pair<double, std::pair<int, Classroom>>> sorted;
	std::vector<std::pair<double, Classroom>> sortedWithoutRandom;

	//Set the weights based on preference
	for (int i=0; i<5; i++){
		std::string x=order[i];
		if (x=="outlets")
			outletWeight=i+1;
		else if (x=="windows")
			windowWeight=i+1;
		else if (x=="classType")
			classWeight=i+1;
		else if (x=="printer")
			printerWeight=i+1;
		else if (x=="tableType")
			tableWeight=i+1;
	}

	//Change weights a little based on previous 10
	int numYesOutlet=0;
	int numYesWindow=0;
	int numYesPrinter=0;
	int numLab=0;
	int numLec=0;
	int numBig=0;
	int numSmall=0;
	for (int j=0; j<10; j++){
		if (previous[j].outlets)
			numYesOutlet++;
		if (previous[j].windows)
			numYesWindow++;
		if (previous[j].printer)
			numYesPrinter++;
		if (previous[j].tabletype=="SmallDesk")
			numSmall++;
		if (previous[j].tabletype=="BigDesk")
			numBig++;
		if (previous[j].classtype=="Lab")
			numLab++;
		if (previous[j].classtype=="Lecture")
			numLec++;
	}
	if (numYesOutlet>=7){
		if (best.outlets)
			outletWeight+=1;
		else
			outletWeight=outletWeight/1.5;
	}
	else if (numYesOutlet<=3){
		if (!best.outlets)
			outletWeight+=1;
		else
			outletWeight=outletWeight/1.5;
	}
	if (numYesWindow>=7){
		if (best.windows)
			windowWeight+=1;
		else
			windowWeight=windowWeight/1.5;
	}
	else if (numYesWindow<=3){
		if (!best.windows)
			windowWeight+=1;
		else
			windowWeight=windowWeight/1.5;
	}
	if (numYesPrinter>=7){
		if (best.printer)
			printerWeight+=1;
		else
			printerWeight=printerWeight/1.5;
	}
	else if (numYesWindow<=3){
		if (!best.printer)
			printerWeight+=1;
		else
			printerWeight=printerWeight/1.5;
	}
	if (numLab>=7){
		if (best.classtype=="Lab")
			classWeight+=1;
		else
			classWeight=classWeight/1.5;
	}
	else if (numLec>=7){
		if (best.classtype=="Lecture")
			classWeight+=1;
		else
			classWeight=classWeight/1.5;
	}
	else if (numLab+numLec<=3){
		if (best.classtype=="Classroom")
			classWeight+=1;
		else
			classWeight=classWeight/1.5;
	}
	if (numBig>=7){
		if (best.tabletype=="BigDesk")
			tableWeight+=1;
		else
			tableWeight=tableWeight/1.5;
	}
	else if (numSmall>=7){
		if (best.tabletype=="SmallDesk")
			tableWeight+=1;
		else
			tableWeight=tableWeight/1.5;
	}
	else if (numSmall+numBig<=3){
		if (best.tabletype=="Table")
			tableWeight+=1;
		else
			tableWeight=tableWeight/1.5;
	}

	//Calculate weight of each classroom
	for (long unsigned int i=0; i<free.size(); i++){
		Classroom temp=free[i];
		double weight=0;
		if (temp.outlets==best.outlets)
			weight+=outletWeight/2;
		if (temp.windows==best.windows)
			weight+=windowWeight/2;
		if (temp.classtype==best.classtype)
			weight+=classWeight/2;
		if (temp.printer==best.printer)
			weight+=printerWeight/2;
		if (temp.tabletype==best.tabletype)
			weight+=tableWeight/2;
		if (temp.building==best.building)
			weight+=buildingWeight/2;
		for (int j=0; j<10; j++){
			if (previous[j]==temp)
				weight+=(1-variety/4);
		}
		sortedWithoutRandom.push_back(std::make_pair(weight, temp));	
	}
	std::sort(sortedWithoutRandom.begin(), sortedWithoutRandom.end(), sort_pred());
	srand(time(NULL));
	for (long unsigned int j=0; j<sortedWithoutRandom.size(); j++){
		double weight=sortedWithoutRandom[j].first;
		if (variety!=0)
			weight+=((float)(rand())/(float)(RAND_MAX))*pow(1.8, variety);
		sorted.push_back(std::make_pair(weight, std::make_pair(j+1, sortedWithoutRandom[j].second)));
	}
	std::sort(sorted.begin(), sorted.end(), sort_pred_pair());
	return sorted;
}

//preferences[outlets, windows, classtype, printer, tabletype]

int main(){
	std::string preferences[5]={"true", "false", "Lecture", "true", "SmallDesk"};
	std::string order[5]={"windows", "outlets", "tableType", "classType", "printer"};

	Classroom room1(true, false, "Lecture", false, "SmallDesk", "Building B", 101);
	Classroom room2(true, true, "Lecture", false, "LargeDesk", "Building A", 102);
	Classroom room3(false, true, "Lab", true, "Table", "Building C", 103);
	Classroom room4(true, false, "Lecture", true, "SmallDesk", "Building C", 104);
	Classroom room5(false, false, "Classroom", true, "LargeDesk", "Building B", 105);
	Classroom room6(true, true, "Classroom", false, "SmallDesk", "Building A", 106);
	std::vector<Classroom> free;
	free.push_back(room1); free.push_back(room2); free.push_back(room3); 
	free.push_back(room4); free.push_back(room5); free.push_back(room6);
	Classroom previous[10]={room1, room1, room2, room1, room5, room4, room3, room6, room2, room1};

	std::vector<std::pair<double, std::pair<int, Classroom>>>  done=imp(free, order, preferences, "Building B", previous, 4);
	for (long unsigned int i=0; i<done.size(); i++){
		std::cout<<"\nClassroom " << done[i].second.second.id << ":" << std::endl;
		done[i].second.second.display();
		std::cout<<"Weight: " << done[i].first << std::endl;
		std::cout<<"Original Position: " << done[i].second.first << std::endl;
	}
}