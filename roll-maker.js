/*jslint browser:true, nomen: true*/
/*eslint-env browser */
/*eslint no-console:0 */
/*global moment, Handlebars, console*/

var settingDefaults = [{
    "id": "names",
    "value": "John Taylor, M-F\nJoseph Smith, M-F\nEmma Smith, M-F\nBrigham Young, M-F\nJohn Taylor, MWF\nWilford Woodruff, TTH\nLorenzo Snow, M-F\nJoseph F. Smith, MWF\nHeber J Grant, TTH\nGeorge Albert Smith, M-F\nDavid O. McKay, MWF\nJoseph Fielding Smith, TTH\nHarold B. Lee, M-F"
}, {
    "id": "daysOff",
    "value": "Christmas, 12-25-17\nNew Years Day, 1-1-18"
}, {
    "id": "dateStart",
    "value": "8-27-17"
}, {
    "id": "dateEnd",
    "value": "5-31-18"
}, {
    "id": "wantHightlighting",
    "checked": true
}];

Handlebars.registerHelper('td', function (dataIn) {
    'use strict';

    var stringOut = '',
        isFirstGroup = dataIn.data._parent._parent._parent.first,
        isFirstPerson = dataIn.data._parent._parent.first,
        isDayOffTopRow = this.isDayOff && isFirstGroup && isFirstPerson,
        isDayOffSkip = this.isDayOff && !(isFirstGroup && isFirstPerson),
        isFirstDayInWeek = dataIn.data.first,
        rowCount = dataIn.data.root.peopleGroups.reduce(function (sum, peopleGroup) {
            sum += peopleGroup.people.length;
            return sum;
        }, 0);

    // send back comment if we are skipping today
    if (isDayOffSkip) {
        return new Handlebars.SafeString('<!-- skip day off -->');
    }


    //the others we can juts add to
    stringOut += '<td class="';

    //add the day
    stringOut += this.DayOfWeek

    if (isDayOffTopRow) {
        stringOut += ' dayOff';
    }

    if (isFirstDayInWeek) {
        stringOut += ' weekendBorder';
    }

    stringOut += '"';

    if (isDayOffTopRow) {
        stringOut += 'rowspan="' + rowCount + '" ><div>' + this.dayOffTitle + '</div>';
    } else {
        stringOut += ' >';
    }
    stringOut += '</td>';


    if (this.isSame(moment('12-25-17', "MM-DD-YY"))) {
        console.log('thie string', stringOut);
        console.log('dataIn', dataIn.data);
        console.log(isFirstGroup);
        console.log(isFirstPerson);
        console.log(isFirstDayInWeek);
    }

    return new Handlebars.SafeString(stringOut);

});

function rollMaker(peopleStr, daysOffStr, dateStartStr, dateEndStr, wantHightlighting) {
    'use strict';
    var i, j, tempdate, htmlOut, currentMonth, currentWeek, peopleGroups,
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
        }),
        daysOff = daysOffStr.trim().split('\n').map(function (row) {
            var parts = row.split(',');
            return {
                name: parts[0].trim(),
                date: moment(parts[1].trim(), 'M-D-YY')
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
            //record the dey of week
            tempdate.DayOfWeek = tempdate.format('ddd');
            //is it a day off?
            for (j = 0; j < daysOff.length; j += 1) {
                if (daysOff[j].date.isSame(tempdate)) {
                    tempdate.isDayOff = true;
                    tempdate.dayOffTitle = daysOff[j].name;
                    j = daysOff.length;
                }
            }

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

//make the button do stuff on click
document.querySelector('#makeRolls').addEventListener('click', function () {
    'use strict';
    var studentsStr = document.querySelector('#names').value,
        daysOffStr = document.querySelector('#daysOff').value,
        dateStartStr = document.querySelector('#dateStart').value,
        dateEndStr = document.querySelector('#dateEnd').value,
        wantHightlighting = document.querySelector('#wantHightlighting').checked;
    rollMaker(studentsStr, daysOffStr, dateStartStr, dateEndStr, wantHightlighting);
});



//make the feilds remember what was typed in
var inputs = settingDefaults.map(function (setting) {
        return document.getElementById(setting.id);
    }),
    localStorageVar = 'JAM.textInputs';

function getKeysFilterId(objIn) {
    return Object.keys(objIn).filter(function (key) {
        return key !== "id"
    });
}

function saveSettings() {
    var settingsOut = settingDefaults.map(function (setting) {
        var objOut = {
            id: setting.id
        };

        var keysNotIds = getKeysFilterId(setting),
            ele = document.getElementById(setting.id);

        keysNotIds.forEach(function (key) {
            objOut[key] = ele[key];
        });

        return objOut;
    });

    console.log("settings", JSON.stringify(settingsOut));
    window.localStorage.setItem(localStorageVar, JSON.stringify(settingsOut));
}

//add the event listeners to the text inputs
inputs.forEach(function (ele) {
    ele.addEventListener('input', saveSettings);
    ele.addEventListener('change', saveSettings);
});


function loadTextAreas() {
    var inputDatas = JSON.parse(window.localStorage.getItem(localStorageVar));
    console.log('load', inputs);
    inputDatas.forEach(function (inputData) {
        var keysNotIds = getKeysFilterId(inputData),
            ele = document.getElementById(inputData.id);

        console.log(inputData)

        //set all the values 
        keysNotIds.forEach(function (key) {
            ele[key] = inputData[key];
        });
    })
}

//add the eventlistener for the button
loadTextAreas();

//event listener to the reset inputs button
function resetInputs() {
    //set the local storage to the defaults 
    window.localStorage.setItem(localStorageVar, JSON.stringify(settingDefaults));
    console.log("here:", window.localStorage.getItem(localStorageVar))

    //then reload them
    loadTextAreas();
}

//add the eventListener for resetInputs button
document.querySelector('#resetInputs').addEventListener('click', resetInputs);
