var svg; // svg gcode visualization
var ieV; // Internet Explorer version

var minX = 0;
var maxX = 0;
var minY = 0;
var maxY = 0;
var minZ = 9999;
var maxZ = 0;
var minF = 9999;
var maxF = 0;
var units = "mm";
var parameters = {}; // parameters that are send to pcb2gcode
var gcodeE = ".ngc";
const PREVIEW_TYPE_VISUALIZATION = 'visualization';
const PREVIEW_TYPE_ORIGINAL = 'org';
const PREVIEW_TYPE_TRACED = 'traced';
const PREVIEW_TYPE_INFO = 'info';
var previewState = PREVIEW_TYPE_VISUALIZATION;
var gcodeState; //= GCODE_TYPE_FRONT;
var gcodeFiles = new Array('front','back','drill','outline');
var userID; // id created in php, per session. Used to name the folder with all his/her data.

function init() {
	//console.group("init");
	ieV = getInternetExplorerVersion();
	//console.log("ieV: ",ieV);
	if(ieV > -1)
	{
		var ieError = document.getElementById('ieerror');
		ieError.style.display = "block";
		ieError.innerHTML = ieError.innerHTML.replace("{version}",ieV);
	}
	if(ieV == -1 || ieV >= 9.0)
	{
		createUserFolder();
		updateSVG();
	}
	//console.groupEnd();
}
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
function getInternetExplorerVersion()
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

function createUserFolder()
{
	var xmlhttp = createRequest();
	xmlhttp.onreadystatechange = function()
	{
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			userID = xmlhttp.responseText;
			//console.log("userID: ",userID);
		}
	}
	xmlhttp.open("GET","pcb2gcode.php?action=createUserFolder");
	xmlhttp.send();
}
function onCreateGCODEMouseDown()
{
	// collect parameters
	var inputDiv = document.getElementById("input");
	var inputs = inputDiv.getElementsByTagName("input");
	var numInputs = inputs.length;
	
	for(var i=0;i<numInputs;i++)
	{
		var input = inputs[i];
		parameters[input.name] = input.value;
		
		//if()
		var inputFileNameKey = input.name.replace("-output","");
		if(gcodeFiles.indexOf(inputFileNameKey) != -1)
		{
			if(input.value == "")
			{
				parameters[input.name] = parameters[inputFileNameKey].replace(/\.[^\.]*$/g,'.ngc');
			}
		}
		//gcodeFiles
		
	}
	
	// convert all the gcode files to mm units using php
	convertFilesToMM();
}
function convertFilesToMM()
{
	//console.log("convertFilesToMM");
	var xmlhttp = createRequest();
	xmlhttp.onreadystatechange = function()
	{
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			// update gcode tabs 
			var gcodeTabsHTML = "";
			//var gcodeDownloadsHTML = "";
			var firstFile = true;
			var firstFileType = "";
			for(var i=0;i<gcodeFiles.length;i++)
			{
				var type = gcodeFiles[i];
				if(parameters[type] == "") continue;
				
				// tab
				gcodeTabsHTML += '<a href="#" onclick="loadGCode(\''+type+'\')">'+type+'</a>';
				
				if(firstFile) firstFileType = type;
				firstFile = false;
			}
			var gcodeTabs = document.getElementById('gcodeTabs');
			gcodeTabs.innerHTML = gcodeTabsHTML;
			
			// load first gcode file
			if(firstFileType != "")
		loadGCode(firstFileType);
		}
	}
	xmlhttp.open("GET","pcb2gcode.php?action=convertFiles&userID="+userID);
	xmlhttp.send();
}
function onGCodeChanged()
{
	updateSVG();
}
function loadGCode(type)
{
	//console.log("loadGCode: ",type);
	var gcode = document.getElementById("gcode");
	gcode.value = 'loading...';
	
	var fileName = parameters['basename']+parameters[type+'-output']+gcodeE;
	//console.log("filename: ",fileName);
	
	var xmlhttp = createRequest();
	xmlhttp.onreadystatechange = function()
	{
		var gcode = document.getElementById("gcode");
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			// fill gcode textarea
			if(xmlhttp.responseText != "")
			{
				gcode.value = xmlhttp.responseText;
				//console.log("xmlhttp.responseText: ",xmlhttp.responseText);
				gotoPreview(previewState);
			}
			else
			{
				gcode.value = 'can\'t find file or can\'t read from file';
			}
		}
	}
	xmlhttp.open("GET","pcb2gcode.php?action=loadFile&fileName="+fileName+"&userID="+userID);
	xmlhttp.send();
	
	// update tabs
	var gcodeTabs = document.getElementById('gcodeTabs');
	var children = gcodeTabs.childNodes;
	for(var i=0;i<children.length;i++)
	{
		var child = children[i];
		if(child.innerHTML == type)
		{
			child.setAttribute('class','active');
		}
		else
		{
			child.removeAttribute('class');
		}
	}
	
	gcodeState = type;
}
function downloadCurrentGCode()
{
	download(gcodeState);
}
function downloadCurrentPreview()
{
	download(previewState);
}
function download(type)
{
	switch(type)
	{
		case 'visualization':
			var content = getNodeXML(svg);
			
			var downloadForm = document.getElementById("downloadForm");
			//console.log("downloadForm: ",downloadForm);
			var inputs = downloadForm.getElementsByTagName("input");//("content");
			for(var i=0;i<inputs.length;i++)
			{
				var input = inputs[i];
				//console.log("input.name: ",input.name);
				switch(input.name)
				{
					case 'content':
						input.value = content;
						break;
					case 'type':
						input.value = type;
						break;
				}
			}
			downloadForm.submit();
			//window.location = "pcb2gcode.php?action=downloadSVG&content="+content+"&type="+type;
			break;
		case 'org':
			var fileName = 'original.png';
			window.location = "pcb2gcode.php?action=downloadFile&fileName="+fileName;
			break;
		case 'traced':
			var fileName = 'traced.png';
			window.location = "pcb2gcode.php?action=downloadFile&fileName="+fileName;
			break;
		case 'all':
			window.location = "pcb2gcode.php?action=downloadAll";
			break;
		default:
			var fileName = parameters['basename']+parameters[type+'-output']+gcodeE;
			window.location = "pcb2gcode.php?action=downloadFile&fileName="+fileName;
			break;
	}
}
function gotoPreview(type)
{
	var previewContainer = document.getElementById('previewContainer');
	var previewMenu = document.getElementById('previewMenu');
	previewContainer.innerHTML = "";
	switch(type)
	{
		case PREVIEW_TYPE_VISUALIZATION:
			previewContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg" width="385" height="400"></svg>';
			
			/*svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.setAttributeNS(null,'xmlns:xlink', 'http://www.w3.org/1999/xlink');
			svg.setAttributeNS(null,'id', 'svg');
			svg.setAttributeNS(null,'width', '400');
			svg.setAttributeNS(null,'height', '400');
			svg.setAttributeNS(null,'preserveAspectRatio', 'xMinYMin');
			previewContainer.appendChild(svg);*/
			
			updateSVG();
			
			previewMenu.style.display = "block";
			break;
		case PREVIEW_TYPE_ORIGINAL:
			previewContainer.innerHTML = '<img src="generated/example/original.png" width="385"/>';
			previewMenu.style.display = "none";
			break;
		case PREVIEW_TYPE_TRACED:
			previewContainer.innerHTML = '<img src="generated/example/traced.png" width="385" />';
			previewMenu.style.display = "none";
			break;
		case PREVIEW_TYPE_INFO:
			var request = createRequest();
			request.onreadystatechange = function() 
			{
				if(request.readyState == 4)
				{
					previewContainer.innerHTML = request.responseText;
				}
			}
			request.open("GET", "info.html", true);
			request.send(null);
			
			previewMenu.style.display = "none";
			break;
	}
	
	// update tabs
	var previewTabs = document.getElementById('previewTabs');
	var children = previewTabs.childNodes;
	for(var i=0;i<children.length;i++)
	{
		var child = children[i];
		if(child.innerHTML == type)
		{
			child.setAttribute('class','active');
		}
		else
		{
			child.removeAttribute('class');
		}
	}
	
	previewState = type;
}

function createRequest()
{
	if(window.XMLHttpRequest) //IE7+, firefox, Chrome, Opera, Safari
	{
		return new XMLHttpRequest();
	}
	else //IE6, IE5
	{
		return new ActiveXObject("Microsoft.XMLHTTP");
	}
}


function updateSVG()
{
	//console.group("updateSVG");
	
	var gcode;
	gcode = document.getElementById('gcode').value;
	//console.log("gcode: ",gcode);
	
	//svg = document.getElementById('svg');
	//console.log("svg: ",svg);
	
	visualizeGCode(gcode);
	
	//console.groupEnd();
}
function visualizeGCode(gcode)
{
	//console.group("visualizeGCode");
	//console.log("gcode: ",gcode);
	
	// remove comments
	gcode = gcode.replace(/\([^\)]*\)/ig, '');
	//console.log("->gcode: ",gcode);
	
	// clear svg
	var previewContainer = document.getElementById('previewContainer');
	while(previewContainer.childNodes.length) previewContainer.removeChild(previewContainer.childNodes[0]);
	
	// recreate svg
	svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	svg.setAttribute('width', 385);
	svg.setAttribute('height', 400);
	previewContainer.appendChild(svg);
	
	svgDoc = svg.ownerDocument;
	var svgNS = svg.getAttribute("xmlns");
	
	var drilling = false;
	var prevX = 0;
	var prevY = 0;
	var polyline;
	var polylinePoints = "";
	minX = 0;
	maxX = 0;
	minY = 0;
	maxY = 0;
	minZ = 9999;
	maxZ = 0;
	minF = 9999;
	maxF = 0;
	
	startIcon = createStartIcon(svgNS);
	svg.appendChild(startIcon);
	
	var lines = gcode.split('\n')
	var numLines = lines.length;
	for(var i=0;i<numLines;i++)
	{
		var line = lines[i];
		var commands = line.split(' ');
		var numCommands = commands.length;
		for(var j=0;j<numCommands;j++)
		{
			var command = commands[j];
			if(command == '') continue;
			//console.log("command: ",command);
			
			var type = command.charAt(0).toUpperCase();
			//console.log("type: ",type);
			var value = parseFloat(command.slice(1));
			//console.log("value: ",value);
			switch(type)
			{
				case "G":
					switch(value)
					{
						case 0:
						case 1:
							if(polyline != undefined && polylinePoints != "")
							{
								polyline.setAttributeNS(null,'points', polylinePoints);
							}
							polyline = svgDoc.createElementNS(svgNS,'polyline');
							polyline.setAttributeNS(null,'fill', "none");
							polyline.setAttributeNS(null,'stroke-width', "0.5");
							polyline.setAttributeNS(null,'stroke-linecap', "round");
							polyline.setAttributeNS(null,'opacity', "0.5");
							
							var drilling = (value == 1);
							polyline.setAttributeNS(null,'stroke', (drilling)? "red" : "green");
							polyline.setAttributeNS(null,'opacity', (drilling)? "0.5" : "0.2");
							
							svg.appendChild(polyline);
							
							polylinePoints = prevX+','+prevY;
							break;
						case 20: //inches
							visualizeGCode(convertAllInches2mm(gcode));
							return;
							break;
						case 21: //mm							
							break;
					}
					break;
				case "X":
					if(polylinePoints != "")
						polylinePoints += ' ';
					polylinePoints += value;
					prevX = value;
					
					if(value < minX) minX = value;
					else if(value > maxX) maxX = value;
					break;
				case "Y":
					polylinePoints += ","+value;
					prevY = value;
					
					if(value < minY) minY = value;
					else if(value > maxY) maxY = value;
					break;
				case "Z":
					if(value < minZ) minZ = value;
					else if(value > maxZ) maxZ = value;
					break;
				case "F":
					if(value < minF) minF = value;
					else if(value > maxF) maxF = value;
					break;
			}
		}
	}
	if(polyline != undefined && polylinePoints != "")
	{
		polyline.setAttributeNS(null,'points', polylinePoints);
	}
	
	finishIcon = createFinishIcon(svgNS,prevX,prevY);
	svg.appendChild(finishIcon);
	
	//svg.setAttributeNS(null,'viewBox', (minX-1)+' '+(minY-1)+' '+(maxX+2)+' '+(maxY+2));
	//svg.setAttributeNS(null,'viewBox', (minX)+' '+(minY)+' '+(maxX)+' '+(maxY));
	
	var width = maxX-minX;
	var height = maxY-minY;
	
	setViewbox((minX-1),(minY-1),(width+2),(height+2));
	//zoom(0);	
	

	
	// events
	svg.onmousedown = onSVGMouseDown;
	svg.onmouseup = onSVGMouseUp;
	svg.onmousemove = onSVGMouseMove;
	
	// update code for download
	//var downloadCode = document.getElementById("downloadCode");
	//downloadCode.value = getNodeXML(svg);
	
	// update bounds display
	var boundsHTML = "bounds:&nbsp&nbsp&nbsp&nbsp";
	boundsHTML += "X: "+minX.toFixed(2)+'|'+maxX.toFixed(2)+'&nbsp&nbsp&nbsp&nbsp';
	boundsHTML += "Y: "+minY.toFixed(2)+'|'+maxY.toFixed(2)+'&nbsp&nbsp&nbsp&nbsp';
	boundsHTML += "Z: "+minZ.toFixed(2)+'|'+maxZ.toFixed(2)+'&nbsp&nbsp&nbsp&nbsp';
	boundsHTML += " mm";
	//console.log("boundsHTML: ",boundsHTML);
	var boundsDisplay = document.getElementById('boundsDisplay');
	boundsDisplay.innerHTML = boundsHTML;
	
	//console.log("svg: ",svg);
	//console.groupEnd();
}

function createStartIcon(svgNS)
{
	var startIcon = svgDoc.createElementNS(svgNS,'circle');
	startIcon.setAttributeNS(null,'cx', 0);
	startIcon.setAttributeNS(null,'cy', 0);
	startIcon.setAttributeNS(null,'r', 0.5);
	startIcon.setAttributeNS(null,'stroke', 'none');
	startIcon.setAttributeNS(null,'fill', '#0066ff');
	startIcon.setAttributeNS(null,'opacity', 1);
	return startIcon;
}
function createFinishIcon(svgNS,x,y)
{
	var finishIcon = svgDoc.createElementNS(svgNS,'circle');
	finishIcon.setAttributeNS(null,'cx', x);
	finishIcon.setAttributeNS(null,'cy', y);
	finishIcon.setAttributeNS(null,'r', 0.7);
	finishIcon.setAttributeNS(null,'stroke', '#0066ff');
	finishIcon.setAttributeNS(null,'stroke-width', 0.2);
	finishIcon.setAttributeNS(null,'fill', 'none');
	finishIcon.setAttributeNS(null,'opacity', 1);
	return finishIcon;
}


function inches2mm(match)
{
	var axis = match.slice(0,1);
	var inches = parseFloat(match.slice(1));
	var mm = inches*25.4;
	var space = match.match(/\s/i);;
  	return axis+mm+space;
}
function convertAllInches2mm(gcode)
{
	//console.log("convertAllInches2mm");
	
	var gcode = gcode.replace('G20', 'G21');
	
	var gcodeMM = gcode.replace(/([X|Y|F|Z])([0-9.-]*?)(\s)/ig, inches2mm);
	return gcodeMM;
}


// convert XML node content into string
function getNodeXML (node) 
{
	if (node)
	{
		return (node.xml || (new XMLSerializer()).serializeToString(node) || ""); //.replace(/(.*)( xmlns=\".*?\")(.*)/g, "$1$3");
	}
	else
	{
		return '';
	}
}

// zooming and moving svg
function zoom(type) 
{
	//console.group("zoom");
	//console.log("type: ",type);
	viewbox = getViewbox(svg);
	//console.log("viewbox: ",viewbox);
	var vx, vy, vw, vh;
	switch(type) {
		case -1: 
			vx = (viewbox.x - 0.1*viewbox.w/2).toPrecision(3);
			vy = (viewbox.y - 0.1*viewbox.h/2).toPrecision(3);
			vw = (viewbox.w*1.1).toPrecision(3);
			vh = (viewbox.h*1.1).toPrecision(3);
			break;
		case 0:
			//var size = Math.max(parseFloat(svg.getAttributeNS(null,'width')), parseFloat(svg.getAttributeNS(null,'height')));
			var size = 400;
			//console.log("width: ",code.documentElement.getAttribute('width'));
			vx = 0-1;
			vy = 0-1;
			vw = maxX-minX+2;
			vh = maxY-minY+2;
			break;
		case 1: 
			vx = (viewbox.x + 0.1*viewbox.w/2).toPrecision(3);
			vy = (viewbox.y + 0.1*viewbox.h/2).toPrecision(3);
			vw = (viewbox.w/1.1).toPrecision(3);
			vh = (viewbox.h/1.1).toPrecision(3);
			break;
	}
	setViewbox(vx,vy,vw,vh);
	//console.groupEnd();
}
var drag;
var offset;
var viewbox;

function onSVGMouseDown(e) 
{
	drag = true;
	
	offset = mouseCoords(e);
	viewbox = getViewbox(svg);
	return false;
}
function onSVGMouseUp(e) 
{
	drag = false;
}
function onSVGMouseMove(e)
{
	if(drag) 
	{
		e = e || window.event;
		var pos = mouseCoords(e);
		
		var previewContainer = document.getElementById("previewContainer");
		
		var dx = (pos.x - offset.x) * viewbox.w/previewContainer.offsetWidth;
		var dy = (pos.y - offset.y) * viewbox.h/previewContainer.offsetHeight;
		
		//console.log("previewContainer.offsetWidth: ",previewContainer.offsetWidth);
		//console.log("previewContainer.offsetHeight: ",previewContainer.offsetHeight);
		
		var vx = (viewbox.x - dx).toPrecision(3);
		var vy = (viewbox.y - dy).toPrecision(3);
		var vw = viewbox.w;
		var vh = viewbox.h;
		svg.setAttribute('viewBox', vx + ' ' + vy + ' ' + vw + ' ' + vh);
		//setViewbox(vx,vy,vw,vh);
		
		return false;
		
	}
}
function getViewbox(svg) 
{
	viewbox = svg.getAttribute('viewBox').split(" ");
	var obj = { 
		x: parseInt(viewbox[0]),
		y: parseInt(viewbox[1]),
		w: parseInt(viewbox[2]),
		h: parseInt(viewbox[3])
		};
	return obj
}
function setViewbox(x,y,w,h) 
{
	var value = (x)+' '+(y)+' '+(w)+' '+(h);
	svg.setAttributeNS(null,'viewBox',value);
}
function mouseCoords(e) 
{
	if(e.pageX || e.pageY)
	{
		obj = { x:e.pageX, y:e.pageY };
	}
	else
	{
		obj = {
			x:e.clientX + document.body.scrollLeft - document.body.clientLeft,
			y:e.clientY + document.body.scrollTop  - document.body.clientTop
		};
	}
	return obj;
}
