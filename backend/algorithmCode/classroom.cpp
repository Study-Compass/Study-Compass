#include <iostream>
#include <string>
#include "classroom.h"



Classroom::Classroom(bool outlets, bool windows, std::string classtype, bool printer, std::string tabletype, std::string building, int id)
    : outlets(outlets), windows(windows), classtype(classtype), printer(printer), tabletype(tabletype), building(building), id(id) {}

void Classroom::display() {
    std::cout << "Classroom Details:\n";
    std::cout << "Outlets: " << (outlets ? "Yes" : "No") << "\n";
    std::cout << "Windows: " << (windows ? "Yes" : "No") << "\n";
    std::cout << "Class Type: " << classtype << "\n";
    std::cout << "Printer: " << (printer ? "Yes" : "No") << "\n";
    std::cout << "Table Type: " << tabletype << "\n";
    std::cout << "Building: " << building << "\n";
    std::cout << "ID: " << id << "\n";
}

bool Classroom::operator==(const Classroom& b){
 return (outlets == b.outlets) 
 && (windows == b.windows) 
 && (classtype == b.classtype)
 && (printer == b.printer) 
 && (tabletype == b.tabletype)
 && (building == b.building);
}
