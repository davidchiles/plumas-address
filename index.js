var AdmZip = require('adm-zip');
var xml2js = require('xml2js');
var json2csv = require('json2csv');
var fs = require('fs');


var nopt = require("nopt")
  , path = require("path")
  , knownOpts = { "zip" : path, "out" : path}
  , parsed = nopt(knownOpts)

var zip = new AdmZip(parsed.zip);
var zipEntries = zip.getEntries();

var parser = new xml2js.Parser();

zipEntries.forEach(function(zipEntry) {
	//Unzip and get kml file. Should be only file.
	if (zipEntry.entryName == "doc.kml") {
		var dataString = zipEntry.getData().toString('utf8'); 
		//Parse XML
		parser.parseString(dataString, function (err, result) {
			//Traverse file hierarchy to get to placemakrs where are the real address data lives
        	var addresses = result.kml.Document[0].Folder[1].Placemark.map(function(placemark){
				var result = {}
				var pointArray = placemark.Point[0].coordinates[0].split(',');
				result.lon = pointArray[0];
				result.lat = pointArray[1];
				placemark.ExtendedData[0].SchemaData[0].SimpleData.forEach(function(data) {
					result[data.$.name] = data._
				});
					return result
			});
			var fields = Object.keys(addresses[0])
			var csvString = json2csv({ data: addresses, fields: fields});
  			fs.writeFileSync(parsed.out,csvString)
    	});
	}
});