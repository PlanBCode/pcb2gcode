<?php
	if(!isset($_GET['action'])) return;

	switch($_GET['action']) 
	{
		case 'generateGCode':
		
			break;
		case 'loadFile':
			@readfile('generated/666/'.$_GET['fileName']);
			break;
		case 'downloadContent':
			$fileName = $_POST['type'];
			switch($_POST['type'])
			{
				case 'visualization':
					header('Content-type: image/svg+xml');
					$fileName .= '.svg';
					break;
			}
			header('Content-Disposition: attachment; filename="'.$fileName.'"');
			echo $_POST['content'];
			break;
		case 'downloadFile':
			header('Content-type: text/plain');
			header('Content-Disposition: attachment; filename="'.$_GET['fileName']);
			@readfile('generated/666/'.$_GET['fileName']);
			break;
		case 'checkFileExistence':
			$fileURL = 'generated/666/'.$_GET['fileName'];
			echo (file_exists($fileURL) && is_readable ($fileURL));
			break;
		case 'downloadAll':
			
			$files = array('back.ngc','drill.ngc');
			zipFilesAndDownload($files,'gcodes.zip','generated/666/');
			
			break;
		case 'storeContentInFile':
			
			
			break;
	}
	
	//function to zip and force download the files using PHP
	function zipFilesAndDownload($file_names,$archive_file_name,$file_path)
	{
		//echo 'zipFilesAndDownload';
		//print_r($file_names);
		//create the object
		$zip = new ZipArchive();
		//$zip = new ZipFile();
		
		//print_r($zip);
		//create the file and throw the error if unsuccessful
		if ($zip->open($archive_file_name, ZIPARCHIVE::CREATE )!==TRUE) 
		{
			//echo "cannot open <$archive_file_name>\n";
			exit("cannot open <$archive_file_name>\n");
		}
		
		//echo 'next for each:';
		//add each files of $file_name array to archive
		foreach($file_names as $file)
		{
			//print_r($files);
			//echo (file_exists($fileURL) && is_readable ($fileURL));
			$zip->addFile($file_path.$file,$file);
		}
		$zip->close();
		
		//then send the headers to foce download the zip file
		header("Content-type: application/zip");
		header("Content-Disposition: attachment; filename=$archive_file_name");
		header("Pragma: no-cache");
		header("Expires: 0");
		readfile("$archive_file_name");
		exit;
	 }
?>