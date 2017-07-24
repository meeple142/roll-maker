/*jslint browser:true*/
/*global moment, Handlebars, console*/

function rollMaker(peopleStr, dateStartStr, dateEndStr, wantHightlighting) {
    'use strict';
    var i, tempdate, htmlOut, currentMonth, currentWeek, peopleGroups,
        dateStart = moment(dateStartStr, 'M-D-YY'),
        dateCounter = moment(dateStart),
        dateEnd = moment(dateEndStr, 'M-D-YY'),
        months = [],
        dayCount = dateEnd.diff(dateStart, 'days'),
        template = Handlebars.compile(document.querySelector('#template').innerHTML),
        people = peopleStr.trim().split('\n').map(function (row) {
            var parts = row.split(',');
            return {
                name: parts[0].trim(),
                daysPresent: parts[1].trim().toUpperCase()
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
        return days[0][0].format('MMMM YYYY');
    });

    //fix up the people array

    //split up the people based on what days the attend
    peopleGroups = people.reduce(function (peopleOut, person) {
        if (peopleOut === null) {
            peopleOut = [
                {
                    name: 'M-F',
                    people: []
                },
                {
                    name: 'MWF',
                    people: []
                },
                {
                    name: 'TTH',
                    people: []
                },
                {
                    name: 'other',
                    people: []
                }
            ];
        }

        var map = {
                'M-F': 0,
                'MWF': 1,
                'TTH': 2
            },
            placement = map[person.daysPresent];
        //to uppercased when parseing the person string

        //if not on list
        if (typeof placement === 'undefined') {
            placement = 3;
        }

        peopleOut[placement].people.push(person);

        return peopleOut;
    }, null).map(function (peopleGroup) {
        //sort each people array
        peopleGroup.people.sort(function (a, b) {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
            }
        });
        return peopleGroup;
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
            tempdate.DayOfWeek = tempdate.format('ddd');
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
            weeks: month,
            wantHightlighting: wantHightlighting
        });
    }).join('\n').replace(/\s+/g, ' ');
    //concat all the strings



    //console.log(htmlOut);

    document.querySelector('#rollmakerOutput').innerHTML = htmlOut;
}

document.querySelector('button').addEventListener('click', function () {
    'use strict';
    var studentsStr = document.querySelector('textarea').value,
        dateStartStr = document.querySelector('#dateStart').value,
        dateEndStr = document.querySelector('#dateEnd').value,
        wantHightlighting = document.querySelector('#wantHightlighting').checked;
    rollMaker(studentsStr, dateStartStr, dateEndStr, wantHightlighting);
});