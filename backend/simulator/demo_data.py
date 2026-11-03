# Small synthetic neighbourhood around a fictional area. Coordinates are illustrative.
# GeoJSON coordinate order is [longitude, latitude].
NEIGHBOURHOOD_NAME = "Demo Neighbourhood"
CENTER = [77.5946, 12.9716]

def line(coords):
    return {"type": "LineString", "coordinates": coords}

def polygon(coords):
    return {"type": "Polygon", "coordinates": [coords]}

ROADS = [
    {"id":"R1","name":"North Avenue","a":"A","b":"B","length":260,"elevation":0.75,"risk":0.15,"geometry":line([[77.5900,12.9750],[77.5950,12.9750]])},
    {"id":"R2","name":"Central Road","a":"B","b":"C","length":220,"elevation":0.35,"risk":0.55,"geometry":line([[77.5950,12.9750],[77.5990,12.9750]])},
    {"id":"R3","name":"Market Street","a":"A","b":"D","length":230,"elevation":0.55,"risk":0.30,"geometry":line([[77.5900,12.9750],[77.5900,12.9710]])},
    {"id":"R4","name":"Lake Road","a":"D","b":"E","length":250,"elevation":0.20,"risk":0.75,"geometry":line([[77.5900,12.9710],[77.5950,12.9710]])},
    {"id":"R5","name":"East Link","a":"E","b":"C","length":240,"elevation":0.45,"risk":0.50,"geometry":line([[77.5950,12.9710],[77.5990,12.9750]])},
    {"id":"R6","name":"South Avenue","a":"D","b":"F","length":250,"elevation":0.65,"risk":0.20,"geometry":line([[77.5900,12.9710],[77.5900,12.9670]])},
    {"id":"R7","name":"River Street","a":"F","b":"G","length":260,"elevation":0.25,"risk":0.80,"geometry":line([[77.5900,12.9670],[77.5950,12.9670]])},
    {"id":"R8","name":"College Road","a":"G","b":"H","length":250,"elevation":0.70,"risk":0.15,"geometry":line([[77.5950,12.9670],[77.5990,12.9710]])},
    {"id":"R9","name":"West Connector","a":"A","b":"F","length":480,"elevation":0.70,"risk":0.20,"geometry":line([[77.5900,12.9750],[77.5900,12.9670]])},
    {"id":"R10","name":"East Connector","a":"C","b":"H","length":480,"elevation":0.60,"risk":0.25,"geometry":line([[77.5990,12.9750],[77.5990,12.9710]])},
]
BUILDINGS = [
    {"id":"B1","name":"Residential Block 1","kind":"residential","risk_base":0.55,"geometry":polygon([[77.5910,12.9740],[77.5930,12.9740],[77.5930,12.9730],[77.5910,12.9730],[77.5910,12.9740]])},
    {"id":"B2","name":"Residential Block 2","kind":"residential","risk_base":0.70,"geometry":polygon([[77.5960,12.9738],[77.5980,12.9738],[77.5980,12.9728],[77.5960,12.9728],[77.5960,12.9738]])},
    {"id":"B3","name":"Community Centre","kind":"community","risk_base":0.35,"geometry":polygon([[77.5920,12.9700],[77.5935,12.9700],[77.5935,12.9690],[77.5920,12.9690],[77.5920,12.9700]])},
    {"id":"B4","name":"Residential Block 3","kind":"residential","risk_base":0.78,"geometry":polygon([[77.5960,12.9698],[77.5980,12.9698],[77.5980,12.9688],[77.5960,12.9688],[77.5960,12.9698]])},
    {"id":"B5","name":"School","kind":"school","risk_base":0.40,"geometry":polygon([[77.5920,12.9665],[77.5940,12.9665],[77.5940,12.9655],[77.5920,12.9655],[77.5920,12.9665]])},
]
FACILITIES = [
    {"id":"H1","name":"Northside Hospital","kind":"hospital","node":"B","coordinates":[77.5950,12.9750]},
    {"id":"H2","name":"Community Clinic","kind":"clinic","node":"G","coordinates":[77.5950,12.9670]},
    {"id":"S1","name":"Demo Public School","kind":"school","node":"H","coordinates":[77.5990,12.9710]},
]
DRAINAGE = [
    {"id":"D1","name":"North Drain","coordinates":[77.5940,12.9740],"condition":0.2},
    {"id":"D2","name":"Lake Drain","coordinates":[77.5920,12.9700],"condition":0.65},
]
NODES = {
    "A":[77.5900,12.9750], "B":[77.5950,12.9750], "C":[77.5990,12.9750],
    "D":[77.5900,12.9710], "E":[77.5950,12.9710], "F":[77.5900,12.9670],
    "G":[77.5950,12.9670], "H":[77.5990,12.9710],
}
