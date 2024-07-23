#include <string>
#ifndef CLASSROOM_H
#define CLASSROOM_H


class Classroom {
public:
    bool outlets;
    bool windows;
    std::string classtype;
    bool printer;
    std::string tabletype;
    std::string building;
    int id;
    Classroom(bool outlets, bool windows, std::string classtype, bool printer, std::string tabletype, std::string building, int id);
    void display();
    bool operator==(const Classroom& b);
  
};

#endif