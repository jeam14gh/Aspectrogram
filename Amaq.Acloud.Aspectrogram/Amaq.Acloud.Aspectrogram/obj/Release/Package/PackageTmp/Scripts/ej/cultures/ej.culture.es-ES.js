ej.addCulture( "es-ES", {
	name: "es-ES",
	englishName: "Spanish (Spain, International Sort)",
	nativeName: "Español (España, alfabetización internacional)",
	language: "es",
	numberFormat: {
        pattern: ["-n"],
		",": ".",
		".": ",",
        groupSizes: [3],
		negativeInfinity: "-Infinito",
		positiveInfinity: "Infinito",
		percent: {
			pattern: ["-n%","n%"],
            groupSizes: [3],
			",": ".",
			".": ",",
            symbol: '%'
		},
		currency: {
			pattern: ["-n $","n $"],
            groupSizes: [3],
			",": ".",
			".": ",",
			symbol: "€"
		}
	},
	calendars: {
		standard: {
			firstDay: 1,
			days: {
				names: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
				namesAbbr: ["Dom","Lun","Mar","Mie","Jue","Vie","Sáb"],
				namesShort: ["Do","Lu","Ma","Mi","Ju","Vi","Sá"]
			},
			months: {
				names: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",""],
				namesAbbr: ["Ene.","Feb.","Mar.","Abr.","May.","Jun.","Jul.","Ago.","Sep.","Oct.","Nov.","Dic.",""]
			},
			AM: null,
			PM: null,
			patterns: {
				d: "dd/MM/yyyy",
				D: "dddd, d' de 'MMMM' de 'yyyy",
				t: "H:mm",
				T: "H:mm:ss",
				f: "dddd, d' de 'MMMM' de 'yyyy H:mm",
				F: "dddd, d' de 'MMMM' de 'yyyy H:mm:ss",
				M: "d' de 'MMMM",
				Y: "MMMM' de 'yyyy"
			}
		}
	}
});