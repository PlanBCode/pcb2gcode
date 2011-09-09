<?php
	if(!isset($_GET['action'])) return;

	switch($_GET['action']) 
	{
	
		
		case 'generateGCode':
		
			break;
		case 'downloadSVG':
			header('Content-type: image/svg+xml');
			header('Content-Disposition: attachment; filename="gcode.svg"');
			echo $_POST['content'];
			break;
	}
?>