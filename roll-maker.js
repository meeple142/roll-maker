/*jslint browser:true */
/*global moment, Handlebars, console*/

function rollMaker(peopleStr, dateStartStr, dateEndStr) {
    'use strict';
    var i, tempdate, htmlOut, currentMonth, currentWeek, peopleGroups,
        dateStart = moment(dateStartStr, 'M-D-YY'),
        //dateStart = moment([2017, 8, 1]),
        dateCounter = moment(dateStart),
        dateEnd = moment(dateEndStr, 'M-D-YY'),
        //dateEnd = moment([2018, 4, 31]),
        months = [],
        dayCount = dateEnd.diff(dateStart, 'days'),
        template = Handlebars.compile(document.querySelector('#template').innerHTML),
        peopleOld = [
            {
                name: "John Taylor",
                daysPresent: "M-F"
            }, {
                name: "Joseph Smith",
                daysPresent: "M-F"
            }, {
                name: "Emma Smith",
                daysPresent: "M-F"
            }, {
                name: "Joshua McKinney",
                daysPresent: "MWF"
            }, {
                name: "Jackie McKinney",
                daysPresent: "MWF"
            }, {
                name: "Daniel McKinney",
                daysPresent: "TTH"
            }, {
                name: "Eva McKinney",
                daysPresent: "TTH"
            }, {
                name: "Clark McKinney",
                daysPresent: "TTH"
            }
        ],
        people = peopleStr.trim().split('\n').map(function (row) {
            var parts = row.split(',');
            return {
                name: parts[0].trim(),
                daysPresent: parts[1].trim()
            };
        });

    console.log(dateStart);
    console.log(dateEnd);

    //fix up handlebars
    Handlebars.registerHelper('dayLetter', function (day) {
        //had to use map because mom wants one leter day names not two letter
        var map = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return map[day.day()];
    });
    Handlebars.registerHelper('dayNumber', function (day) {
        return day.date();
    });
    Handlebars.registerHelper('monthName', function (days) {
        return days[0][0].format('MMMM');
    });

    //fix up the people array

    //split up the people based on what days the attend
    peopleGroups = people.reduce(function (peopleOut, person) {
        var map = {
                'm-f': 0,
                'mwf': 1,
                'tth': 2
            },
            placement = map[person.daysPresent.toLowerCase()];

        //if not on list
        if (typeof placement === 'undefined') {
            placement = 3;
        }

        peopleOut[placement].push(person);

        return peopleOut;
    }, [[], [], [], []]).map(function (peopleGroup) {
        //sort each array
        return peopleGroup.sort(function (a, b) {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
            }
        });
    });


    //switch order if in wrong order
    if (dayCount < 0) {
        tempdate = moment(dateStart);
        dateStart = moment(dateEnd);
        dateEnd = moment(tempdate);
        dayCount *= -1;
    }

    //make a list of all the days we want
    //months will be an array of weeks of arrays of days.
    for (i = 0; i <= dayCount; i += 1) {
        //clone for this loop
        tempdate = moment(dateCounter);

        //add empty array if first day of month
        if (tempdate.date() === 1 || i === 0) {
            months.push([]);
        }
        //currentMonth = last month in list
        currentMonth = months[months.length - 1];

        //add empty array if first day of week
        if (tempdate.day() === 0 || currentMonth.length === 0) {
            currentMonth.push([]);
        }
        currentWeek = currentMonth[currentMonth.length - 1];

        //check current day is a weekday
        //filter out 0=Sundays and 6=Saturdays 
        if (tempdate.day() > 0 && tempdate.day() < 6) {
            //allways add new day to the last week array in the month array in the months list
            currentWeek.push(tempdate);
        }

        dateCounter.add(1, 'days');
    }

    //for testing
    console.log(months);
    console.log(peopleGroups);



    //make all the html
    htmlOut = months.map(function (month) {
        return template({
            peopleGroups: peopleGroups,
            weeks: month
        });
    }).join('\n').replace(/\s+/g, ' ');
    //concat all the strings



    //console.log(htmlOut);

    document.querySelector('#rollmakerOutput').innerHTML = htmlOut;
}
rollMaker(document.querySelector('textarea').innerHTML, document.querySelector('#dateStart').value, document.querySelector('#dateEnd').value);