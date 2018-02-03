  /*
 * Funciones que permiten un tratamiento de los datos obtenidos de la señal.
 * Espectro de amplitud, fase, imaginario, real, Filtros, Orbitas y SCL.
 */

function formatDate(date, includeMils, includeTime) {
    var year, month, day, hour, mins, secs, milsec, resp;

    includeMils = includeMils | false;
    includeTime = (includeTime === undefined) ? true : includeTime;
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
    hour = date.getHours();
    mins = date.getMinutes();
    secs = date.getSeconds();
    milsec = date.getMilliseconds();

    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    hour = hour < 10 ? "0" + hour : hour;
    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;
    if (milsec < 10) {
        milsec = "00" + milsec;
    } else if (milsec >= 10 & milsec < 100) {
        milsec = "0" + milsec;
    }
    resp = year + "/" + month + "/" + day;
    resp += (includeTime) ? " " + hour + ":" + mins + ":" + secs : "";
    resp += (includeMils) ? "." + milsec : "";
    return resp;
}

function parseAng(ang) {
    if (ang >= 0) {
        return ("    " + ("+" + ang)).slice(-4).replace(/\s/g, "&nbsp;");
    } else {
        return ("    " + ang.toString()).slice(-4).replace(/\s/g, "&nbsp;");
    }
}

function UTCToLocalTimeString(d) {
    var timeOffsetInHours = (new Date().getTimezoneOffset() / 60);
    d.setHours(d.getHours() + timeOffsetInHours);
    return d;
}

function RoundToPlaces(number, places) {
    return +(Math.round(number + "e+" + places) + "e-" + places);
}

function GetXYDataOnTime(signal, sampleTime) {
    var step, xyData = [], i;
    step = sampleTime * 1000 / signal.length;
    for (i = 0; i < signal.length; i += 1) {
        xyData.push([RoundToPlaces((step * i), 6), signal[i]]);
    }
    return xyData;
}

// Convierte las posiciones de keyphasor en posiciones en el tiempo
function GetKeyphasorOnTime(keyphasorPositions, sampleTime, signalLength) {
    var step, xData = [], i;
    step = sampleTime * 1000 / signalLength;
    for (i = 0; i < keyphasorPositions.length; i += 1) {
        xData.push(RoundToPlaces((step * keyphasorPositions[i]), 6));
    }
    return xData;
}

// Retorna el par X,Y necesario para la graficacion (segun muestras / frecuencia).
function GetXYData(signal) {
    var xyData = [], i;
    for (i = 0; i < signal.length; i += 1) {
        xyData.push([i, signal[i]]);
    }
    return xyData;
}

function GetXYDataWithBin(signal, bin) {
    var xyData = [], i;
    xyData.push([0, 0]);
    for (i = 1; i < signal.length; i += 1) {
        xyData.push([i * bin, signal[i]]);
    }
    return xyData;
}

function GetFullSpectrumWithBin(signal, bin) {
    var xyData = [], i, n;
    n = signal.Reverse.length;
    xyData.push([0, 0, null]);
    for (i = (n - 1); i > 0; i -= 1) {
        xyData.push([(i - n) * bin, signal.Reverse[i - 1], null]);
    }
    xyData.reverse();
    xyData.push([0, null, 0]);
    for (i = 1; i < n; i += 1) {
        xyData.push([i * bin, null, signal.Forward[i]]);
    }
    return xyData;
}

function GetBSIFactor(measureType, n) {
    var bSi;
    switch (measureType) {
        case 1:
            // Amplitud cero a pico => (2 / n) * 1
            bSi = 2 / n;
            break;
        case 2:
            // Amplitud pico a pico => (2 / n) * 2
            bSi = 4 / n;
            break;
        case 3:
            // Amplitud rms => (2 / n) * (sqrt(2) / 2)
            bSi = Math.sqrt(2) / n;
            break;
        default:
            throw "No se ha configurado el tipo de medida: " + measureType;
    }
    return bSi;
}

function HammingWindow(signal, windowFactor) {
    var n, N;
    windowFactor.value = 1.82;
    N = signal.length;
    for (n = 0; n < N; n += 1) {
        signal[n] = (0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1))) * signal[n];
    }
}

function HanningWindow(signal, windowFactor) {
    var n, N;
    windowFactor.value = 2.00;
    N = signal.length;
    for (n = 0; n < N; n += 1) {
        signal[n] = (1 / 2) * (1 - Math.cos((2 * Math.PI * n) / (N - 1))) * signal[n];
    }
}

function BlackmanHarrisWindow(signal, windowFactor) {
    var n, N;
    windowFactor.value = 2.72;
    N = signal.length;
    for (n = 0; n < N; n += 1) {
        signal[n] = (0.35875 - 0.48829 * Math.cos((2 * Math.PI * n) / (N - 1)) +
                    0.14128 * Math.cos((4 * Math.PI * n) / (N - 1)) -
                    0.01168 * Math.cos((6 * Math.PI * n) / (N - 1))) * signal[n];
    }
}

// Filtra la señal usando Fourier filter
function GetFilterSignal(signal, cutoff) {
    var
        real,
        imag,
        i,
        filter;

    real = [];
    imag = [];

    if (typeof signal !== "undefined" && signal !== null) {
        for (i = 0; i < signal.length; i += 1) {
            real[i] = signal[i];
            imag[i] = 0;
        }
        filter = new FFTFilter();
        //filter.BandPass(real, imag, cutoff - 1, cutoff + 1);
        filter.LowPass(real, imag, cutoff);
    } else {
        real.push([1,0]);
    }
    return real;
}

// Obtiene el espectro de la forma de onda dada, retorna el par X,Y necesario para la graficacion.
function GetHalfSpectrum(signal, sampleRate, measureType, windowValue, rpm) {
    var
        i, bin,
        real, imag,
        bSi,
        n, N,
		phase,
		magnitude,
        waveform,
        windowFactor;

    // Por defecto amplitud cero a pico
    measureType = measureType || 1;
    bin = sampleRate / signal.length;
    waveform = clone(signal);
    real = [];
    imag = [];
    windowFactor = { value: 1 };
    switch (windowValue) {
        case windowing.Hamming.Value:
            HammingWindow(waveform, windowFactor);
        case windowing.Hanning.Value:
            HanningWindow(waveform, windowFactor);
        default:
            break;
    }
    for (i = 0; i < waveform.length; i += 1) {
        real[i] = waveform[i];
        imag[i] = 0;
    }
    new FourierTransform().Forward(real, imag);
    n = real.length;
    bSi = GetBSIFactor(measureType, n);
    N = n / 2;
    phase = [];
    magnitude = [];
    for (i = 0; i < N; i += 1) {
        magnitude[i] = bSi * Math.sqrt(Math.pow(real[i], 2) + Math.pow(imag[i], 2)) * windowFactor.value;
        phase[i] = Math.atan2(imag[i], real[i]) * 180 / Math.PI;
    }
    return {
        mag: GetXYDataWithBin(magnitude, bin),
        pha: GetXYDataWithBin(phase, bin),
        xOne: Math.round(rpm / 60) * bin
    };
}

function GetFullSpectrum(signalX, signalY, sampleRate, measureType, windowValue) {
    var
        i, bin,
        real, imag,
        waveformX,
        waveformY,
        windowFactor,
        bSi, n, N,
        Xn, Yn,
        alpha, beta,
        resp;

    // Por defecto amplitud cero a pico
    measureType = measureType || 1;
    bin = sampleRate / signalX.length;
    waveformX = clone(signalX);
    waveformY = clone(signalY);
    realX = [];
    imagX = [];
    realY = [];
    imagY = [];
    windowFactor = { value: 1 };
    switch (windowValue) {
        case windowing.Hamming.Value:
            HammingWindow(waveformX, windowFactor);
            HammingWindow(waveformY, windowFactor);
        case windowing.Hanning.Value:
            HanningWindow(waveformX, windowFactor);
            HanningWindow(waveformY, windowFactor);
        default:
            break;
    }
    for (i = 0; i < waveformX.length; i += 1) {
        realX[i] = waveformX[i];
        imagX[i] = 0;
        realY[i] = waveformY[i];
        imagY[i] = 0;
    }
    new FourierTransform().Forward(realX, imagX);
    new FourierTransform().Forward(realY, imagY);
    n = realX.length;
    bSi = GetBSIFactor(measureType, n);
    N = n / 2;
    Xn = [];
    Yn = [];
    alpha = [];
    beta = [];
    for (i = 0; i < N; i += 1) {
        Xn[i] = bSi * Math.sqrt(Math.pow(realX[i], 2) + Math.pow(imagX[i], 2)) * windowFactor.value;
        alpha[i] = Math.atan2(imagX[i], realX[i]);
        Yn[i] = bSi * Math.sqrt(Math.pow(realY[i], 2) + Math.pow(imagY[i], 2)) * windowFactor.value;
        beta[i] = Math.atan2(imagY[i], realY[i]);
    }
    resp = { Reverse: [], Forward: [] };
    // Calcular reverse y forward
    for (i = 0; i < N; i += 1) {
        resp.Reverse.push(Math.sqrt(Math.pow(Xn[i], 2) + Math.pow(Yn[i], 2) - 2 * Xn[i] * Yn[i] * Math.sin(alpha[i] - beta[i])));
        resp.Forward.push(Math.sqrt(Math.pow(Xn[i], 2) + Math.pow(Yn[i], 2) + 2 * Xn[i] * Yn[i] * Math.sin(alpha[i] - beta[i])));
    }
    resp.Reverse.reverse();
    return GetFullSpectrumWithBin(resp, bin);
}

// Obtiene la orbita filtrada 1X de un par de puntos de medicion.
function GetOrbit1X(signalX, signalY, keyphasorX, keyphasorY, phiX, phiY, laps, gapX, gapY) {
    var
        data,
        x, y,
        end,
        i, j, k,
        arr,
        filter,
        largestX, largestY,
        xMax, yMax, xMin, yMin,
        largest,
        deltaX, deltaY,
        ptsToRemove,
        real, imag,
        freq1x;

    data = {
        value: [],
        rangeX: [],
        rangeY: []
    };
    largestX = 0;
    largestY = 0;
    gapX = (gapX) ? gapX : 0;
    gapY = (gapY) ? gapY : 0;

    freq1x = keyphasorX.length;
    if (freq1x < 2) {
        xMax = 0;
        xMin = 0;
        yMax = 0;
        yMin = 0;
        for (i = 0; i < signalX.length; i += 1) {
            x = -(signalX[i] + gapX) * Math.sin(phiX) - (signalY[i] + gapY) * Math.sin(phiY);
            y = (signalX[i] + gapX) * Math.cos(phiX) + (signalY[i] + gapY) * Math.cos(phiY);
            xMax = (x > xMax) ? x : xMax;
            xMin = (x < xMin) ? x : xMin;
            yMax = (y > yMax) ? y : yMax;
            yMin = (y < yMin) ? y : yMin;
            largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
            largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
            data.value.push([x, y]);
        }
        //data.value.push([0, 0]);
        largest = [(xMax - xMin), (yMax - yMin)].max();
        largest = (largest === 0) ? 5 : largest;
        deltaX = (2 * largest - (xMax - xMin)) / 2;
        deltaY = (2 * largest - (yMax - yMin)) / 2;
        xMin -= deltaX;
        xMax += deltaX;
        yMin -= deltaY;
        yMax += deltaY;
        data.rangeX = [xMin, xMax];
        data.rangeY = [yMin, yMax];
        return data;
    }

    // Filtramos
    real = [];
    imag = [];
    for (i = 0; i < signalX.length; i += 1) {
        real[i] = signalX[i];
        imag[i] = 0;
    }
    filter = new FFTFilter();
    filter.BandPass(real, imag, freq1x - 1, freq1x + 1);
    signalX = real;
    real = [];
    imag = [];
    for (i = 0; i < signalY.length; i += 1) {
        real[i] = signalY[i];
        imag[i] = 0;
    }
    filter.BandPass(real, imag, freq1x - 1, freq1x + 1);
    signalY = real;

    laps = (laps) ? laps : 2;
    xMax = -signalX[keyphasorX[0]] * Math.sin(phiX) - signalY[keyphasorX[0]] * Math.sin(phiY);
    xMin = xMax;
    yMax = signalX[keyphasorX[0]] * Math.cos(phiX) + signalY[keyphasorX[0]] * Math.cos(phiY);
    yMin = yMax;

    for (k = 0; k < laps; k += 1) {
        ptsToRemove = (keyphasorX[k + 1] - keyphasorX[k]) * 0.06;
        end = keyphasorX[k + 1] - ptsToRemove;
        for (i = keyphasorX[k], j = keyphasorY[k]; i < end; i += 1, j += 1) {
            x = -(signalX[i] + gapX) * Math.sin(phiX) - (signalY[j] + gapY) * Math.sin(phiY);
            y = (signalX[i] + gapX) * Math.cos(phiX) + (signalY[j] + gapY) * Math.cos(phiY);
            xMax = (x > xMax) ? x : xMax;
            xMin = (x < xMin) ? x : xMin;
            yMax = (y > yMax) ? y : yMax;
            yMin = (y < yMin) ? y : yMin;
            largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
            largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
            data.value.push([x, y]);
        }
        data.value.push([null, null]);
    }

    largest = [(xMax - xMin), (yMax - yMin)].max();
    largest = (largest === 0) ? 5 : largest;
    deltaX = (2 * largest - (xMax - xMin)) / 2;
    deltaY = (2 * largest - (yMax - yMin)) / 2;
    xMin -= deltaX;
    xMax += deltaX;
    yMin -= deltaY;
    yMax += deltaY;
    data.rangeX = [xMin, xMax];
    data.rangeY = [yMin, yMax];
    return data;
}

// Obtiene la orbita de un par de puntos de medicion, esto es, segun dos señales dadas como parametro.
function GetOrbitFull(signalX, signalY, keyphasorX, keyphasorY, phiX, phiY, laps, gapX, gapY) {
    var data, x, y, end, i, j, k, arr, largestX, largestY, xMax, yMax, xMin, yMin, largest, deltaX, deltaY, ptsToRemove;
    data = {
        value: [],
        rangeX: [],
        rangeY: []
    };

    largestX = 0;
    largestY = 0;
    gapX = (gapX) ? gapX : 0;
    gapY = (gapY) ? gapY : 0;
    if (keyphasorX.length < 2) {
        xMax = 0;
        xMin = 0;
        yMax = 0;
        yMin = 0;
        for (i = 0; i < signalX.length; i += 1) {
            x = -(signalX[i] + gapX) * Math.sin(phiX) - (signalY[i] + gapY) * Math.sin(phiY);
            y = (signalX[i] + gapX) * Math.cos(phiX) + (signalY[i] + gapY) * Math.cos(phiY);
            xMax = (x > xMax) ? x : xMax;
            xMin = (x < xMin) ? x : xMin;
            yMax = (y > yMax) ? y : yMax;
            yMin = (y < yMin) ? y : yMin;
            largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
            largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
            data.value.push([x, y]);
        }
        //data.value.push([0, 0]);
        largest = [(xMax - xMin), (yMax - yMin)].max();
        largest = (largest === 0) ? 5 : largest;
        deltaX = (2 * largest - (xMax - xMin)) / 2;
        deltaY = (2 * largest - (yMax - yMin)) / 2;
        xMin -= deltaX;
        xMax += deltaX;
        yMin -= deltaY;
        yMax += deltaY;
        data.rangeX = [xMin, xMax];
        data.rangeY = [yMin, yMax];
        return data;
    }
    //if (keyphasorX.length < 2) {
    //    data.value.push([0, 0]);
    //    return data;
    //}

    laps = (laps) ? laps : 1;
    xMax = -signalX[keyphasorX[0]] * Math.sin(phiX) - signalY[keyphasorX[0]] * Math.sin(phiY);
    xMin = xMax;
    yMax = signalX[keyphasorX[0]] * Math.cos(phiX) + signalY[keyphasorX[0]] * Math.cos(phiY);
    yMin = yMax;

    for (k = 0; k < laps; k += 1) {
        ptsToRemove = (keyphasorX[k + 1] - keyphasorX[k]) * 0.06;
        end = keyphasorX[k + 1] - ptsToRemove;
        for (i = keyphasorX[k], j = keyphasorY[k]; i < end; i += 1, j += 1) {
            x = -(signalX[i] + gapX) * Math.sin(phiX) - (signalY[j] + gapY) * Math.sin(phiY);
            y = (signalX[i] + gapX) * Math.cos(phiX) + (signalY[j] + gapY) * Math.cos(phiY);
            xMax = (x > xMax) ? x : xMax;
            xMin = (x < xMin) ? x : xMin;
            yMax = (y > yMax) ? y : yMax;
            yMin = (y < yMin) ? y : yMin;
            largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
            largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
            data.value.push([x, y]);
        }
        data.value.push([null, null]);
    }
    
    largest = [(xMax - xMin), (yMax - yMin)].max();
    largest = (largest === 0) ? 5 : largest;
    deltaX = (2 * largest - (xMax - xMin)) / 2;
    deltaY = (2 * largest - (yMax - yMin)) / 2;
    xMin -= deltaX;
    xMax += deltaX;
    yMin -= deltaY;
    yMax += deltaY;
    data.rangeX = [xMin, xMax];
    data.rangeY = [yMin, yMax];
    return data;
}

function GetShaftPosition(gapX, gapY, shaftData) {
    var data, initialGapX, initialGapY, sensibility, x, y, largestX, largestY, xMax, yMax, xMin, yMin, largest, deltaX, deltaY;
    data = {
        value: [],
        rangeX: [],
        rangeY: []
    };
    initialGapX = shaftData.gapReferenceX;
    initialGapY = shaftData.gapReferenceY;
    sensibility = shaftData.sensibility;
    xMax = (-(gapX[0].Value - initialGapX) * Math.sin(shaftData.phiX) - (gapY[0].Value - initialGapY) * Math.sin(shaftData.phiY)) * 1000 / sensibility;
    xMin = xMax;
    yMax = ((gapX[0].Value - initialGapX) * Math.cos(shaftData.phiX) + (gapY[0].Value - initialGapY) * Math.cos(shaftData.phiY)) * 1000 / sensibility;
    yMin = yMax;
    largestX = 0;
    largestY = 0;

    for (i = 0; i < gapX.length; i += 1) {
        x = -(gapX[i].Value - initialGapX) * Math.sin(shaftData.phiX) - (gapY[i].Value - initialGapY) * Math.sin(shaftData.phiY);
        y =  (gapX[i].Value - initialGapX) * Math.cos(shaftData.phiX) + (gapY[i].Value - initialGapY) * Math.cos(shaftData.phiY);
        x = x * 1000 / sensibility;
        y = y * 1000 / sensibility;
        xMax = (x > xMax) ? x : xMax;
        xMin = (x < xMin) ? x : xMin;
        yMax = (y > yMax) ? y : yMax;
        yMin = (y < yMin) ? y : yMin;
        largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
        largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
        data.value.push([x, y]);
    }
    largest = [(xMax - xMin), (yMax - yMin)].max();
    largest = (largest === 0) ? 5 : largest;
    deltaX = (2 * largest - (xMax - xMin)) / 2;
    deltaY = (2 * largest - (yMax - yMin)) / 2;
    xMin -= deltaX;
    xMax += deltaX;
    yMin -= deltaY;
    yMax += deltaY;
    data.rangeX = [xMin, xMax];
    data.rangeY = [yMin, yMax];
    return data;
}

function GetSignal(frequency, amplitude, bufferSize, sampleRate, phase) {
    phase = phase * Math.PI / 180;
    var osc = new Oscillator(frequency, amplitude, bufferSize, sampleRate, phase);
    return osc.Generate();
}

function GenerateCosine(frequency, amplitude, bufferSize, sampleRate, phase)
{
    var
        buffer,
        i;

    buffer = [];
    for (i = 0; i < bufferSize; i += 1)
    {
        buffer[i] = amplitude * Math.cos(Math.PI * 2 * frequency * i / sampleRate + phase);
    }
    return buffer;
}
