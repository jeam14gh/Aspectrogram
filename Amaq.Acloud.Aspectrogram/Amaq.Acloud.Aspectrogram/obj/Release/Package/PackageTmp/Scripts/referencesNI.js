/*
 * referencesNI.js
 * @author Jhon Esneider Alvarez M
 */

var ReferencesNI = {};

ReferencesNI = (function () {
    "use strict";
    var
            // Auto-referencia a la clase referencesNI
            _this;

    _this = this;

    /* Constructor */
    ReferencesNI = function () {

        this.GetByNI = function (ni) {
            var data;
            if (ni == "9234") {
                data = {
                    ranges: [
                        { text: "Otro", value: 0 },
                        { text: "100", value: 100 },
                        { text: "200", value: 200 },
                        { text: "400", value: 400 },
                        { text: "800", value: 800 },
                        { text: "1600", value: 1600 },
                        { text: "3200", value: 3200 },
                        { text: "6400", value: 6400 },
                        { text: "12800", value: 12800 },
                        { text: "25600", value: 25600 },
                    ],
                    fs: [
                            {
                                text: "1651.6",
                                value: 1651.6,
                            },
                            {
                                text: "1706.7",
                                value: 1706.7,
                            },
                            {
                                text: "1756.5",
                                value: 1756.5,
                            },
                            {
                                text: "1828.6",
                                value: 1282.6,
                            },
                            {
                                text: "1896.3",
                                value: 1896.3,
                            },
                            {
                                text: "1969.2",
                                value: 1969.2,
                            },
                            {
                                text: "2048.0",
                                value: 2048.0,
                            },
                            {
                                text: "2133.3",
                                value: 2133.3,
                            },
                            {
                                text: "2226.1",
                                value: 2226.1,
                            },
                            {
                                text: "2327.3",
                                value: 2327.3,
                            },
                            {
                                text: "2438.1",
                                value: 2438.1,
                            },
                            {
                                text: "2560.0",
                                value: 2560.0,
                            },
                            {
                                text: "2694.7",
                                value: 2694.7,
                            },
                            {
                                text: "2844.4",
                                value: 2844.4,
                            },
                            {
                                text: "3011.8",
                                value: 3011.8,
                            },
                            {
                                text: "3200.0",
                                value: 3200.0,
                            },
                            {
                                text: "3413.3",
                                value: 3413.3,
                            },
                            {
                                text: "3657.1",
                                value: 3657.1,
                            },
                            {
                                text: "3938.5",
                                value: 3938.5,
                            },
                            {
                                text: "4266.7",
                                value: 4266.7,
                            },
                            {
                                text: "4654.5",
                                value: 4654.4,
                            },
                            {
                                text: "5120.0",
                                value: 5120.0,
                            },
                            {
                                text: "5688.9",
                                value: 5688.9,
                            },
                            {
                                text: "6400.0",
                                value: 6400.0,
                            },
                            {
                                text: "7314.3",
                                value: 7314.3,
                            },
                            {
                                text: "8533.3",
                                value: 8533.3,
                            },
                            {
                                text: "10240.0",
                                value: 10240.0,
                            },
                            {
                                text: "12800.0",
                                value: 12800.0,
                            },
                            {
                                text: "17066.7",
                                value: 17066.7,
                            },
                            {
                                text: "25600.0",
                                value: 25600.0,
                            },
                            {
                                text: "51200.0",
                                value: 51200.0,
                            },
                    ]
                };
            }
            else if (ni == "9230") {
                data = {
                    ranges: [
                        { text: "Otro", value: 0 },
                        { text: "100", value: 100 },
                        { text: "200", value: 200 },
                        { text: "400", value: 400 },
                        { text: "800", value: 800 },
                        { text: "1600", value: 1600 },
                        { text: "3200", value: 3200 },
                        { text: "6400", value: 6400 },
                    ],
                    fs: [
                    {
                        text: "984.6",
                        value: 984.6,
                    },
                    {
                        text: "1024.0",
                        value: 1024.0,
                    },
                    {
                        text: "1066.7",
                        value: 1067.7,
                    },
                    {
                        text: "1113.0",
                        value: 1113.0,
                    },
                    {
                        text: "1163.6",
                        value: 1163.6,
                    },
                    {
                        text: "1219.0",
                        value: 1219.0,
                    },
                    {
                        text: "1280.0",
                        value: 1280.0,
                    },
                    {
                        text: "1347.4",
                        value: 1347.4,
                    },
                    {
                        text: "1422.2",
                        value: 1422.2,
                    },
                    {
                        text: "1505.9",
                        value: 1505.9,
                    },
                    {
                        text: "1600.0",
                        value: 1600.0,
                    },
                    {
                        text: "1706.7",
                        value: 1706.7,
                    },
                    {
                        text: "1828.6",
                        value: 1828.6,
                    },
                    {
                        text: "1969.2",
                        value: 1969.2,
                    },
                    {
                        text: "2048.0",
                        value: 2048.0,
                    },
                    {
                        text: "2133.3",
                        value: 2133.3,
                    },
                    {
                        text: "2226.1",
                        value: 2226.1,
                    },
                    {
                        text: "2327.3",
                        value: 2327.3,
                    },
                    {
                        text: "2438.1",
                        value: 2438.1,
                    },
                    {
                        text: "2560.0",
                        value: 2560.0,
                    },
                    {
                        text: "2694.7",
                        value: 2694.7,
                    },
                    {
                        text: "2844.4",
                        value: 2844.4,
                    },
                    {
                        text: "3011.8",
                        value: 3011.8,
                    },
                    {
                        text: "3200.0",
                        value: 3200.0,
                    },
                    {
                        text: "3413.3",
                        value: 3413.3,
                    },
                    {
                        text: "3657.1",
                        value: 3657.1,
                    },
                    {
                        text: "3938.5",
                        value: 3938.5,
                    },
                    {
                        text: "4096.0",
                        value: 4096.0,
                    },
                    {
                        text: "4266.7",
                        value: 4266.7,
                    },
                    {
                        text: "4452.2",
                        value: 4452.2,
                    },
                    {
                        text: "4654.5",
                        value: 4654.4,
                    },
                    {
                        text: "4876.2",
                        value: 4876.2,
                    },
                    {
                        text: "5120.0",
                        value: 5120.0,
                    },
                    {
                        text: "5389.5",
                        value: 5389.5,
                    },
                    {
                        text: "5688.9",
                        value: 5688.9,
                    },
                    {
                        text: "6023.5",
                        value: 6023.5,
                    },
                    {
                        text: "6400.0",
                        value: 6400.0,
                    },
                    {
                        text: "6826.7",
                        value: 6826.7,
                    },
                    {
                        text: "7314.3",
                        value: 7314.3,
                    },
                    {
                        text: "7876.9",
                        value: 7876.9,
                    },
                    {
                        text: "8533.3",
                        value: 8533.3,
                    },
                    {
                        text: "9309.1",
                        value: 9309.1,
                    },
                    {
                        text: "10240.0",
                        value: 10240.0,
                    },
                    {
                        text: "11377.8",
                        value: 11377.8,
                    },
                    {
                        text: "12800.0",
                        value: 12800.0,
                    },
                    ]
                };
            }
            else if (ni == "9232") {
                data = {
                    ranges: [
                        { text: "Otro", value: 0 },
                        { text: "100", value: 100 },
                        { text: "200", value: 200 },
                        { text: "400", value: 400 },
                        { text: "800", value: 800 },
                        { text: "1600", value: 1600 },
                        { text: "3200", value: 3200 },
                        { text: "6400", value: 6400 },
                        { text: "12800", value: 12800 },
                        { text: "25600", value: 25600 },
                        { text: "51200", value: 51200 }
                    ],
                    fs: [
                            {
                                text: "984.6",
                                value: 984.6,
                            },
                            {
                                text: "1024.0",
                                value: 1024.0,
                            },
                            {
                                text: "1066.7",
                                value: 1067.7,
                            },
                            {
                                text: "1113.0",
                                value: 1113.0,
                            },
                            {
                                text: "1163.6",
                                value: 1163.6,
                            },
                            {
                                text: "1219.0",
                                value: 1219.0,
                            },
                            {
                                text: "1280.0",
                                value: 1280.0,
                            },
                            {
                                text: "1347.4",
                                value: 1347.4,
                            },
                            {
                                text: "1422.2",
                                value: 1422.2,
                            },
                            {
                                text: "1505.9",
                                value: 1505.9,
                            },
                            {
                                text: "1600.0",
                                value: 1600.0,
                            },
                            {
                                text: "1706.7",
                                value: 1706.7,
                            },
                            {
                                text: "1828.6",
                                value: 1828.6,
                            },
                            {
                                text: "1969.2",
                                value: 1969.2,
                            },
                            {
                                text: "2048.0",
                                value: 2048.0,
                            },
                            {
                                text: "2133.3",
                                value: 2133.3,
                            },
                            {
                                text: "2226.1",
                                value: 2226.1,
                            },
                            {
                                text: "2327.3",
                                value: 2327.3,
                            },
                            {
                                text: "2438.1",
                                value: 2438.1,
                            },
                            {
                                text: "2560.0",
                                value: 2560.0,
                            },
                            {
                                text: "2694.7",
                                value: 2694.7,
                            },
                            {
                                text: "2844.4",
                                value: 2844.4,
                            },
                            {
                                text: "3011.8",
                                value: 3011.8,
                            },
                            {
                                text: "3200.0",
                                value: 3200.0,
                            },
                            {
                                text: "3413.3",
                                value: 3413.3,
                            },
                            {
                                text: "3657.1",
                                value: 3657.1,
                            },
                            {
                                text: "3938.5",
                                value: 3938.5,
                            },
                            {
                                text: "4096.0",
                                value: 4096.0,
                            },
                            {
                                text: "4266.7",
                                value: 4266.7,
                            },
                            {
                                text: "4452.2",
                                value: 4452.2,
                            },
                            {
                                text: "4654.5",
                                value: 4654.5,
                            },
                            {
                                text: "4876.2",
                                value: 4876.2,
                            },
                            {
                                text: "5120.0",
                                value: 5120.0,
                            },
                            {
                                text: "5389.5",
                                value: 5389.5,
                            },
                            {
                                text: "5688.9",
                                value: 5688.9,
                            },
                            {
                                text: "6023.5",
                                value: 6023.5,
                            },
                            {
                                text: "6400.0",
                                value: 6400.0,
                            },
                            {
                                text: "6826.7",
                                value: 6826.7,
                            },
                            {
                                text: "7314.3",
                                value: 7314.3,
                            },
                            {
                                text: "7876.9",
                                value: 7876.9,
                            },
                            {
                                text: "8533.3",
                                value: 8533.3,
                            },
                            {
                                text: "9309.1",
                                value: 9309.1,
                            },
                            {
                                text: "10240.0",
                                value: 10240.0,
                            },
                            {
                                text: "11377.8",
                                value: 11377.8,
                            },
                            {
                                text: "12800.0",
                                value: 12800.0,
                            },
                            {
                                text: "14628.6",
                                value: 14628.6,
                            },
                            {
                                text: "17066.7",
                                value: 17066.7,
                            },
                            {
                                text: "20480.0",
                                value: 20480.0,
                            },
                            {
                                text: "25600.0",
                                value: 25600.0,
                            },
                            {
                                text: "34133.3",
                                value: 34133.3,
                            },
                            {
                                text: "51200.0",
                                value: 51200.0,
                            },
                            {
                                text: "102400.0",
                                value: 102400.0,
                            },
                    ]
                };
            }
            else if (ni == "9237") {
                data = {
                    ranges: [
                        { text: "Otro", value: 0 },
                        { text: "100", value: 100 },
                        { text: "200", value: 200 },
                        { text: "400", value: 400 },
                        { text: "800", value: 800 },
                        { text: "1600", value: 1600 },
                        { text: "3200", value: 3200 },
                        { text: "6400", value: 6400 },
                        { text: "12800", value: 12800 },
                    ],
                    fs: [
                            {
                                text: "1612.9",
                                value: 1612.9,
                            },
                            {
                                text: "1666.7",
                                value: 1666.7,
                            },
                            {
                                text: "1724.1",
                                value: 1724.1,
                            },
                            {
                                text: "1785.7",
                                value: 1785.7,
                            },
                            {
                                text: "1851.9",
                                value: 1851.9,
                            },
                            {
                                text: "1923.1",
                                value: 1923.1,
                            },
                            {
                                text: "2000.0",
                                value: 2000.0,
                            },
                            {
                                text: "2083.3",
                                value: 2083.3,
                            },
                            {
                                text: "2173.9",
                                value: 2173.9,
                            },
                            {
                                text: "2272.7",
                                value: 2272.7,
                            },
                            {
                                text: "2381.0",
                                value: 2381.0,
                            },
                            {
                                text: "2500.0",
                                value: 2500.0,
                            },
                            {
                                text: "2631.6",
                                value: 2631.6,
                            },
                            {
                                text: "2777.8",
                                value: 2777.8,
                            },
                            {
                                text: "2941.2",
                                value: 2941.2,
                            },
                            {
                                text: "3125.0",
                                value: 3125.0,
                            },
                            {
                                text: "3333.3",
                                value: 3333.3,
                            },
                            {
                                text: "3571.4",
                                value: 3571.4,
                            },
                            {
                                text: "3846.2",
                                value: 3846.2,
                            },
                            {
                                text: "4166.7",
                                value: 4166.7,
                            },
                            {
                                text: "4545.5",
                                value: 4545.5,
                            },
                            {
                                text: "5000.0",
                                value: 5000.0,
                            },
                            {
                                text: "5555.6",
                                value: 5555.6,
                            },
                            {
                                text: "6250.0",
                                value: 6250.0,
                            },
                            {
                                text: "7142.9",
                                value: 7142.9,
                            },
                            {
                                text: "8333.3",
                                value: 8333.3,
                            },
                            {
                                text: "10000.0",
                                value: 10000.0,
                            },
                            {
                                text: "12500.0",
                                value: 12500.0,
                            },
                            {
                                text: "16666.7",
                                value: 16666.7,
                            },
                            {
                                text: "25000.0",
                                value: 25000.0,
                            },
                            {
                                text: "50000.0",
                                value: 50000.0,
                            },
                    ]
                };
            }
            else if (ni == "9205") {
                data = {
                    ranges: [
                        { text: "Otro", value: 0 },
                    ],
                    fs: []
                };
            }

            return data;
        }       
    };

    return ReferencesNI;
})();